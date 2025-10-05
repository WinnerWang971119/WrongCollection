# 圖片上傳系統文檔

## 📌 系統概述

錯題收集系統的圖片上傳功能，支援題目圖片和詳解圖片各 **最多 2 張**。

---

## 🎯 功能特性

### ✅ 已實現功能

1. **多圖上傳（2+2）**
   - 題目圖片：最多 2 張
   - 詳解圖片：最多 2 張
   - 支援格式：JPG, PNG, WEBP, HEIC

2. **自動壓縮**
   - 前端使用 `browser-image-compression` 壓縮
   - 目標大小：1MB
   - 最大尺寸：1920px

3. **拖放上傳**
   - 支援拖放檔案到上傳區
   - 支援點擊選擇檔案
   - 預覽圖片縮圖

4. **Storage 管理**
   - Supabase Storage bucket: `question-images`
   - 路徑格式：`{user_id}/{question_id}_{timestamp}_{type}_{index}.{ext}`
   - 公開讀取，認證寫入/刪除

5. **RLS 安全策略**
   - SELECT: 所有人可讀（公開）
   - INSERT: 只能上傳到自己的資料夾
   - DELETE: 只能刪除自己的檔案

6. **CASCADE 刪除**
   - 刪除錯題時自動清理 Storage 圖片
   - 使用 `image_cleanup_queue` 表追蹤待刪除圖片
   - Trigger 自動加入清理佇列

---

## 🏗️ 架構設計

### 資料庫 Schema

```sql
-- questions 表（新增欄位）
ALTER TABLE questions
  ADD COLUMN question_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN explanation_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  DROP COLUMN question_image_url;

-- 限制陣列長度
ALTER TABLE questions
  ADD CONSTRAINT question_images_max_2 CHECK (array_length(question_images, 1) <= 2),
  ADD CONSTRAINT explanation_images_max_2 CHECK (array_length(explanation_images, 1) <= 2);
```

### Storage 結構

```
question-images/
├── {user_id}/
│   ├── {question_id}_1704067200000_question_0.jpg
│   ├── {question_id}_1704067200000_question_1.jpg
│   ├── {question_id}_1704067200000_explanation_0.jpg
│   └── {question_id}_1704067200000_explanation_1.jpg
```

### API 路由

#### POST /api/upload/question-image
上傳單張圖片

**Request (FormData):**
```typescript
{
  file: File,              // 圖片檔案
  type: 'question' | 'explanation',  // 圖片類型
  index: number,           // 圖片索引（0 或 1）
  questionId?: string      // 錯題 ID（可選）
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    path: string,   // Storage 路徑
    url: string     // 公開 URL
  }
}
```

#### DELETE /api/upload/question-image
刪除單張圖片

**Request (JSON):**
```typescript
{
  path: string   // Storage 路徑
}
```

---

## 🛠️ 開發指南

### 1. 安裝依賴

```bash
npm install browser-image-compression
```

### 2. Supabase Storage 設定

1. 登入 Supabase Dashboard
2. 前往 Storage → Buckets
3. 創建新 Bucket：`question-images`
4. 設定為 Public bucket
5. 配置 RLS 策略（見 Migration 003）

### 3. 使用 MultiImageUpload 元件

```tsx
import { MultiImageUpload, type ImageFile } from '@/components/ui/multi-image-upload';

function MyComponent() {
  const [images, setImages] = useState<ImageFile[]>([]);

  return (
    <MultiImageUpload
      images={images}
      onImagesChange={setImages}
      maxImages={2}
      label="上傳圖片"
      helperText="最多 2 張，自動壓縮至 1MB"
    />
  );
}
```

### 4. 上傳圖片

```typescript
import { uploadQuestionImages } from '@/lib/api/image.api';

// 上傳多張圖片
const imagePaths = await uploadQuestionImages(
  images,
  'question',  // 或 'explanation'
  questionId   // 可選
);
```

### 5. 刪除圖片

```typescript
import { deleteQuestionImages } from '@/lib/api/image.api';

// 刪除多張圖片
await deleteQuestionImages(['path1', 'path2']);
```

---

## 📝 使用流程

### 新增錯題時上傳圖片

1. **Step 1：基本資訊**
   - 使用 MultiImageUpload 選擇題目圖片（最多 2 張）
   - 圖片自動壓縮並上傳到臨時路徑

2. **Step 2：答案與詳解**
   - 使用 MultiImageUpload 選擇詳解圖片（最多 2 張）
   - 圖片自動壓縮並上傳到臨時路徑

3. **Step 3：提交錯題**
   - 收集所有已上傳圖片的路徑
   - 與錯題資料一起提交到 API
   - 圖片路徑儲存到 `question_images` 和 `explanation_images` 欄位

### 查看錯題時顯示圖片

1. **QuestionDetailDialog** 顯示錯題詳情
2. 題目區域：網格顯示最多 2 張題目圖片
3. 詳解區域：網格顯示最多 2 張詳解圖片
4. 點擊圖片：新視窗開啟大圖

### 刪除錯題時清理圖片

1. 刪除錯題前，取得所有圖片路徑
2. 刪除錯題記錄（CASCADE 刪除關聯）
3. 異步刪除 Storage 中的圖片檔案

---

## 🔐 安全性設計

### RLS 策略

```sql
-- Policy 1: 公開讀取
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-images');

-- Policy 2: 只能上傳到自己的資料夾
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'question-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: 只能刪除自己的檔案
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'question-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 檔案驗證

```typescript
// 前端驗證
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// API 驗證
- 檢查檔案類型
- 檢查檔案大小
- 檢查路徑所有權
```

---

## 🧪 測試指南

### 手動測試流程

1. **新增錯題**
   - 測試上傳 0 張、1 張、2 張圖片
   - 測試拖放和點擊選擇
   - 驗證壓縮效果（檔案大小 < 1MB）

2. **查看錯題**
   - 驗證圖片正確顯示
   - 測試點擊放大功能
   - 檢查圖片載入速度

3. **刪除錯題**
   - 刪除含圖片的錯題
   - 檢查 Storage 圖片是否清理

4. **編輯錯題（TODO Phase 1F）**
   - 新增圖片
   - 刪除圖片
   - 替換圖片

### 測試檔案

```bash
# 測試圖片
- small.jpg (< 100KB)
- medium.jpg (500KB - 1MB)
- large.jpg (> 2MB，測試壓縮)
- invalid.txt (測試格式驗證)
```

---

## 🐛 常見問題

### Q: 圖片上傳失敗

**可能原因：**
1. Storage Bucket 未創建或配置錯誤
2. RLS 策略未設定
3. 檔案格式不支援
4. 網路連線問題

**解決方案：**
- 檢查 Supabase Dashboard → Storage
- 驗證 RLS 策略
- 查看瀏覽器 Console 錯誤訊息

### Q: 圖片無法顯示

**可能原因：**
1. Storage Bucket 非公開
2. 圖片路徑錯誤
3. RLS 讀取權限未設定

**解決方案：**
- 確認 Bucket 為 Public
- 檢查路徑格式
- 驗證 SELECT Policy

### Q: 刪除錯題後圖片仍存在

**可能原因：**
1. 刪除邏輯未執行
2. Trigger 未建立
3. 異步刪除失敗

**解決方案：**
- 檢查 API 刪除邏輯
- 驗證 Trigger 存在
- 查看 Server Log

---

## 📊 效能優化

### 已實現

1. **前端壓縮**：上傳前壓縮至 1MB
2. **異步刪除**：不阻塞 API 回應
3. **CDN 快取**：Supabase Storage 自動 CDN

### 待優化（未來）

1. **懶載入**：圖片滾動到可視區域再載入
2. **縮圖生成**：列表顯示用小圖
3. **批次上傳**：同時上傳多張圖片
4. **進度條**：顯示上傳進度

---

## 🚀 未來計劃

### Phase 1F: 編輯功能（待實作）

- [ ] 錯題編輯時修改圖片
- [ ] 圖片排序功能
- [ ] 圖片裁剪工具

### Phase 2: 進階功能（待規劃）

- [ ] 圖片 OCR 文字識別
- [ ] 圖片標註工具
- [ ] 圖片浮水印

---

**最後更新**: 2025-01-05
**版本**: v1.0
**作者**: AI Coding Agent
