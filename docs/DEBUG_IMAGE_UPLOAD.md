# 圖片上傳問題診斷與修復

## 🔍 問題分析

### 問題 1: 驗證邏輯錯誤
**現象**: 上傳了圖片，但系統仍要求填寫題目內容

**原因**:
1. `MultiImageUpload` 元件的狀態（`questionImages`）沒有同步到 React Hook Form 的 `question_images` 欄位
2. 驗證時檢查的是表單欄位 `data.question_images`，但此時它是空陣列
3. 圖片路徑只在提交時才寫入表單

**流程問題**:
```
使用者上傳圖片
  → questionImages 狀態更新 ✓
  → 但 form.watch('question_images') 仍是 [] ✗
    → 驗證失敗 ✗
      → 要求填寫題目內容 ✗
```

### 問題 2: 資料庫沒有照片
**現象**: 錯題建立成功，但資料庫中圖片欄位是空陣列 `[]`

**可能原因**:
1. Migration 003 沒有執行 → 欄位不存在
2. 圖片上傳到 Storage 失敗
3. 圖片路徑沒有正確傳遞到 API

---

## 🛠️ 修復方案

### 修復 1: 同步圖片狀態到表單

**修改檔案**: `components/questions/NewQuestionDialog.tsx`

**修改內容**: 在每個步驟驗證前，先將圖片路徑同步到表單

```typescript
const validateStep = async (step: number): Promise<boolean> => {
  switch (step) {
    case 1:
      // ✅ 在驗證前同步圖片路徑
      const questionImagePaths = questionImages
        .filter((img) => img.uploaded && img.path)
        .map((img) => img.path!);
      form.setValue('question_images', questionImagePaths);
      
      fields = ['title', 'question_images', 'question_text'];
      break;
    // ...
  }
}
```

**效果**:
- 驗證時 `data.question_images` 會包含已上傳的圖片路徑
- 如果有圖片，驗證會通過
- 不再錯誤要求填寫題目內容

### 修復 2: 添加視覺反饋

**修改檔案**: `components/questions/Step1BasicInfo.tsx`

**修改內容**: 顯示已上傳圖片數量

```tsx
{questionImages.filter(img => img.uploaded).length > 0 && (
  <p className="text-xs text-green-600">
    ✓ 已上傳 {questionImages.filter(img => img.uploaded).length} 張圖片
  </p>
)}
```

**效果**:
- 使用者上傳圖片後，看到「✓ 已上傳 X 張圖片」
- 清楚知道圖片已成功上傳

### 修復 3: 改善錯誤提示

**修改檔案**: `components/questions/Step1BasicInfo.tsx`

**修改內容**: 只在沒有圖片且沒有文字時顯示錯誤

```tsx
{errors.question_text && !questionImages.some(img => img.uploaded) && (
  <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-700">
    ⚠️ 題目照片或題目內容至少需要填寫一項
  </div>
)}
```

**效果**:
- 有圖片時，不會顯示錯誤提示
- 避免使用者困惑

---

## 📋 檢查清單

### 步驟 1: 確認 Migration 003 已執行

在 Supabase Dashboard → SQL Editor 執行:

```sql
-- 檢查欄位是否存在
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name IN ('question_images', 'explanation_images');
```

**預期結果**:
```
column_name          | data_type | is_nullable
---------------------+-----------+-------------
question_images      | ARRAY     | NO
explanation_images   | ARRAY     | NO
```

**如果沒有結果**: 需要執行 Migration 003（複製完整 SQL 到 SQL Editor）

### 步驟 2: 測試圖片上傳

1. 打開瀏覽器開發者工具（F12）
2. 切到 Network 標籤
3. 新增錯題
4. 上傳一張圖片
5. 查看 Network 請求

**預期看到**:
```
POST /api/upload/question-image
Status: 200 OK
Response: {
  "success": true,
  "data": {
    "path": "xxxxx-xxxx-xxxx/temp_1234567890_question_0.jpg",
    "url": "https://xxx.supabase.co/storage/v1/object/public/question-images/..."
  }
}
```

**如果失敗**: 檢查 Storage Bucket 是否已建立

### 步驟 3: 測試錯題提交

1. 填寫標題
2. **只上傳圖片，不填文字**
3. 填寫答案
4. 選擇資料夾
5. 提交

**預期結果**:
- ✅ 驗證通過（不再要求填寫題目內容）
- ✅ 提交成功
- ✅ Toast 顯示「錯題新增成功」

### 步驟 4: 驗證資料庫

在 Supabase Dashboard → Table Editor → questions

**檢查新建立的錯題**:
```sql
SELECT id, title, question_images, explanation_images 
FROM questions 
ORDER BY created_at DESC 
LIMIT 1;
```

**預期結果**:
```
id       | title      | question_images                              | explanation_images
---------|------------|----------------------------------------------|-------------------
uuid...  | 測試題目   | {user_id/question_id_timestamp_question_0.jpg} | {}
```

**如果 question_images 是 `{}`**: 圖片路徑沒有正確傳遞到 API

---

## 🐛 Debug 步驟

### Debug 1: 檢查圖片狀態

在 `NewQuestionDialog.tsx` 的 `onSubmit` 函數中添加 console.log:

```typescript
const onSubmit = async (data: CreateQuestionInput) => {
  console.log('📸 Form data:', data);
  console.log('📸 Question images state:', questionImages);
  console.log('📸 Question image paths:', questionImagePaths);
  console.log('📸 Submit data:', submitData);
  
  // ... 其他代碼
}
```

**檢查點**:
1. `data.question_images` - 應該包含路徑陣列
2. `questionImages` - 應該有 `uploaded: true` 和 `path` 屬性
3. `questionImagePaths` - 應該是字串陣列
4. `submitData.question_images` - 應該是字串陣列

### Debug 2: 檢查 API 請求

在瀏覽器開發者工具 → Network → 找到 POST /api/questions

**檢查 Request Payload**:
```json
{
  "title": "測試題目",
  "question_text": null,
  "question_images": ["user_id/path_to_image.jpg"],  // ← 應該有值
  "explanation_images": [],
  "my_answer": "...",
  "correct_answer": "...",
  "difficulty": "medium",
  "folder_ids": ["..."]
}
```

**如果 `question_images` 是 `[]`**: 圖片路徑沒有正確收集

### Debug 3: 檢查 Storage

在 Supabase Dashboard → Storage → question-images

**應該看到**:
```
user_id/
  ├── temp_1234567890_question_0.jpg
  └── temp_1234567890_question_1.jpg
```

**如果沒有檔案**: 上傳失敗，檢查 RLS 策略

---

## 🎯 完整測試流程

### 測試案例 1: 只上傳圖片
1. 標題: "測試圖片上傳"
2. 圖片: 上傳 1 張
3. 題目文字: 留空
4. 答案: 填寫
5. 資料夾: 選擇

**預期**: ✅ 提交成功，資料庫有圖片路徑

### 測試案例 2: 只填文字
1. 標題: "測試純文字"
2. 圖片: 不上傳
3. 題目文字: 填寫
4. 答案: 填寫
5. 資料夾: 選擇

**預期**: ✅ 提交成功，資料庫無圖片

### 測試案例 3: 圖片 + 文字
1. 標題: "測試混合"
2. 圖片: 上傳 2 張
3. 題目文字: 填寫
4. 答案: 填寫
5. 資料夾: 選擇

**預期**: ✅ 提交成功，資料庫有 2 張圖片路徑

### 測試案例 4: 什麼都不填
1. 標題: "測試驗證"
2. 圖片: 不上傳
3. 題目文字: 留空
4. 答案: 填寫

**預期**: ❌ 無法進入下一步，顯示錯誤提示

---

## 🔧 常見問題

### Q: 上傳圖片後，驗證仍失敗
**A**: 檢查圖片是否真的上傳成功（`img.uploaded === true`）

### Q: 資料庫中 question_images 是空陣列
**A**: 
1. 檢查 Migration 003 是否執行
2. 檢查 Network 請求的 Payload
3. 檢查 API 是否正確接收圖片陣列

### Q: 圖片上傳到 Storage 但資料庫沒有
**A**: 檢查 `onSubmit` 函數中的 `submitData` 是否包含圖片路徑

---

**最後更新**: 2025-10-05  
**狀態**: 🔧 修復中
