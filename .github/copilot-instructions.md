# WrongCollection - AI Coding Agent 開發指南

## 📌 專案概述
**WrongCollection** 是一個現代化的智能錯題收集系統，專為學習者打造。

**核心特色**：
- 📁 4 層資料夾架構（完整 CRUD）
- 📝 結構化錯題記錄（題目、答案、詳解）
- 📸 智能圖片上傳（2+2 images, 自動壓縮）
- 🎯 手動複習系統（答對/答錯追蹤）
- ✏️ 完整編輯功能（含圖片管理）
- 🔐 企業級安全（RLS + Storage 權限）

---

## 🎯 當前階段：Phase 1 完成，準備 Phase 2

### ✅ Phase 1 已完成（v0.3.0-dev）

#### Phase 1A: 基礎架構
- ✅ Next.js 15.5.4 + TypeScript
- ✅ Tailwind CSS + shadcn/ui
- ✅ Supabase 客戶端配置
- ✅ 型別定義系統

#### Phase 1B: 認證系統
- ✅ Email + 密碼註冊/登入
- ✅ Email 驗證（PKCE/Token Hash/Token）
- ✅ Middleware 路由守衛
- ✅ 錯誤處理頁面
- ✅ Dashboard 骨架

#### Phase 1C: 資料夾管理
- ✅ 完整 CRUD（新增、編輯、刪除）
- ✅ 樹狀顯示（展開/收合）
- ✅ 4 層階層限制（前後端驗證）
- ✅ CASCADE 刪除
- ✅ Tab 切換式內容顯示
  - 子資料夾 Tab（卡片網格）
  - 錯題本人 Tab（本層錯題）
  - 全部錯題 Tab（本層+子層）

#### Phase 1D: 錯題管理
- ✅ **新增錯題**：3 步驟表單
  - Step 1: 基本資訊（標題、題目文字/圖片）
  - Step 2: 答案內容（我的答案、正確答案、詳解、詳解圖片、難度）
  - Step 3: 選擇資料夾（多選）
- ✅ **查看錯題**：詳情對話框
  - 題目卡片（藍色）
  - 我的答案（紅色）
  - 正確答案（綠色）
  - 詳解（紫色）
  - 圖片顯示（單圖佔滿、雙圖左右分列）
- ✅ **編輯錯題**：完整編輯功能
  - 載入現有資料
  - 支援修改所有欄位
  - 圖片新增/刪除/管理
- ✅ **刪除錯題**：連帶刪除 Storage 圖片
- ✅ **難度標記**：簡單/中等/困難（星星顯示）
- ✅ **多資料夾歸屬**：一題可加入多個資料夾

#### Phase 1E: 手動複習系統
- ✅ **鍵盤快捷鍵**：Space（顯示答案）、←（答錯）、→（答對）
- ✅ **錯誤次數追蹤**：答對 -1、答錯 +1、最小值 0
- ✅ **複習時間記錄**：last_reviewed_at 自動更新
- ✅ **統計資訊**：錯誤次數、最後複習時間、創建時間

#### Phase 1F: 圖片上傳系統
- ✅ **2+2 圖片架構**：題目 2 張 + 詳解 2 張
- ✅ **自動壓縮**：大圖壓縮到 1MB（1920px）
- ✅ **自動上傳**：選擇後自動壓縮→上傳→同步
- ✅ **拖曳上傳**：支援拖曳檔案
- ✅ **多圖顯示**：網格布局、響應式
- ✅ **Storage 整合**：Public bucket + RLS 政策
- ✅ **編輯支援**：載入、新增、刪除圖片
- ✅ **檔案驗證**：格式（JPG/PNG/WEBP/HEIC）、大小（5MB）、數量（2 張）

---

## 🏗️ 技術棧

### 前端
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Form**: React Hook Form + Zod
- **Image**: browser-image-compression
- **Toast**: Sonner
- **Icons**: Lucide React

### 後端
- **BaaS**: Supabase
  - PostgreSQL 資料庫
  - Authentication (Email + Password)
  - Row Level Security (RLS)
  - Storage (圖片上傳)

### 開發工具
- **Package Manager**: npm
- **Linting**: ESLint + TypeScript
- **Version Control**: Git + GitHub

---

## 📊 資料模型

### Users (Supabase Auth)
```sql
auth.users {
  id: uuid (PK)
  email: string
  created_at: timestamp
}
```

### Folders
```sql
folders {
  id: uuid (PK)
  user_id: uuid (FK -> auth.users.id)
  name: string (1-50字元)
  parent_id: uuid (FK -> folders.id, nullable)
  level: integer (1-4)
  created_at: timestamp
  updated_at: timestamp
}
```

**約束**：
- Level 1-4 限制
- 根資料夾：parent_id = NULL, level = 1
- 子資料夾：level = parent.level + 1
- CASCADE DELETE

### Questions
```sql
questions {
  id: uuid (PK)
  user_id: uuid (FK -> auth.users.id)
  title: string
  question_text: text
  question_images: text[] (max 2)
  my_answer: text
  correct_answer: text
  explanation: text
  explanation_images: text[] (max 2)
  difficulty: enum('easy', 'medium', 'hard')
  wrong_count: integer (default: 1)
  last_reviewed_at: timestamp
  created_at: timestamp
  updated_at: timestamp
}
```

### Question_Folders (多對多關聯)
```sql
question_folders {
  question_id: uuid (FK -> questions.id)
  folder_id: uuid (FK -> folders.id)
  created_at: timestamp
  PRIMARY KEY (question_id, folder_id)
}
```

---

## 📁 專案結構

```
WrongCollection/
├── app/                          # Next.js App Router
│   ├── (public)/                 # 公開頁面
│   │   └── auth/                 # 登入、註冊、驗證
│   ├── (protected)/              # 受保護頁面
│   │   └── dashboard/            # 主控台
│   └── api/                      # API Routes
│       ├── folders/              # 資料夾 API
│       ├── questions/            # 錯題 API
│       └── upload/               # 圖片上傳 API
├── components/
│   ├── folders/                  # 資料夾元件（10+ 個）
│   ├── questions/                # 錯題元件（8+ 個）
│   └── ui/                       # shadcn/ui + MultiImageUpload
├── lib/
│   ├── api/                      # API 客戶端
│   ├── supabase/                 # Supabase 配置
│   ├── validations/              # Zod schemas
│   └── constants/                # 常數定義
├── types/                        # TypeScript 型別
├── supabase/migrations/          # SQL Migrations (3 個)
├── docs/                         # 文件（Code Review, 測試指南）
└── middleware.ts                 # 路由守衛
```

---

## 🎨 設計系統

### 色彩主題
- **Primary**: 藍色系（Blue 500-600）
- **Success**: 綠色（答對、已上傳）
- **Error**: 紅色（答錯、錯誤）
- **Warning**: 橙色（待複習）
- **Info**: 紫色（詳解）

### 布局
- **Sidebar**: 400px（資料夾樹）
- **Main Content**: Flex-1（動態內容）
- **Dialog**: Max-w-3xl（對話框）
- **Card Grid**: 3-4 列（響應式）

### 響應式
- **Desktop**: ≥ 1024px（完整功能）
- **Tablet**: 768-1023px（調整布局）
- **Mobile**: < 768px（堆疊顯示）

---

## 🔐 安全架構

### RLS 政策
```sql
-- Users can only access own data
CREATE POLICY "Users can CRUD own folders"
ON folders FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own questions"
ON questions FOR ALL
USING (auth.uid() = user_id);
```

### Storage RLS
```sql
-- Users can only upload to own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'question-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 驗證層
- **前端**: Zod Schema 驗證
- **後端**: API Route 再次驗證
- **輸入**: XSS 防護（React 轉義）
- **SQL**: 使用 Supabase ORM（防注入）

---

## 📸 圖片上傳流程

### 自動化流程
```
選擇圖片 → 驗證格式 → 壓縮圖片 → 上傳 Storage → 取得 URL → 同步表單 → 提交資料庫
```

### MultiImageUpload 元件
```typescript
// 自動上傳 useEffect
useEffect(() => {
  const uploadPendingImages = async () => {
    const pending = images.filter(img => 
      !img.uploading && !img.uploaded && !img.path
    );
    
    for (const img of pending) {
      // 設定 uploading 狀態
      // 呼叫 uploadQuestionImage(file, imageType, index)
      // 更新 path 和 uploaded
      // Toast 通知
    }
  };
  uploadPendingImages();
}, [images, imageType]);
```

### NewQuestionDialog 自動同步
```typescript
// 自動同步圖片路徑到表單
useEffect(() => {
  const paths = questionImages
    .filter(img => img.uploaded && img.path)
    .map(img => img.path!);
  
  form.setValue('question_images', paths);
}, [questionImages, form]);
```

---

## 🎯 開發規範

### 命名規則
- **元件**: PascalCase (`FolderTree.tsx`)
- **函數**: camelCase (`getUserFolders`)
- **常數**: UPPER_SNAKE_CASE (`MAX_FOLDER_LEVEL`)
- **型別**: PascalCase (`FolderItem`)

### API 設計
```typescript
// RESTful 風格
POST   /api/questions         // 新增
GET    /api/questions         // 列表
GET    /api/questions/[id]    // 詳情
PATCH  /api/questions/[id]    // 更新
DELETE /api/questions/[id]    // 刪除
```

### 錯誤處理
```typescript
try {
  await apiCall();
  toast.success('✅ 操作成功');
} catch (error) {
  console.error('操作失敗:', error);
  toast.error('❌ 操作失敗：' + error.message);
} finally {
  setLoading(false);
}
```

### 表單驗證
```typescript
// Zod Schema
export const createQuestionSchema = z.object({
  title: z.string().min(1).max(100),
  question_images: z.array(z.string()).max(2),
  question_text: z.string().optional(),
  // ...
}).refine(
  (data) => data.question_images.length > 0 || data.question_text,
  { message: '題目照片或題目內容至少需要填寫一項' }
);
```

---

## 🔄 更新日誌

### 2025-10-05 晚上
- ✅ **Phase 1 完成！**
- ✅ 建立 EditQuestionDialog（編輯功能）
- ✅ 整合編輯到 QuestionsTab
- ✅ 圖片編輯支援（載入、新增、刪除）
- ✅ Code Review 報告
- ✅ 更新 README.md
- ✅ 更新 copilot-instructions.md

### 2025-10-05 下午
- ✅ **Phase 1F 完成：圖片上傳系統**
- ✅ MultiImageUpload 自動上傳
- ✅ NewQuestionDialog 自動同步
- ✅ QuestionDetailDialog 多圖顯示
- ✅ 修復圖片 URL 轉換問題
- ✅ 修復驗證 Bug（圖片路徑空陣列）

### 2025-10-05 上午
- ✅ **Phase 1E 完成：手動複習系統**
- ✅ 答對/答錯 API
- ✅ 鍵盤快捷鍵
- ✅ 錯誤次數追蹤

### 2025-10-05 凌晨
- ✅ **Phase 1D 完成：錯題管理系統**
- ✅ NewQuestionDialog（3 步驟）
- ✅ QuestionDetailDialog（詳情顯示）
- ✅ 錯題 CRUD API

### 2025-10-04
- ✅ **Phase 1C 完成：資料夾管理**
- ✅ 完整 CRUD 功能
- ✅ Tab 切換式內容顯示
- ✅ Dashboard UX 優化

### 2025-10-04
- ✅ **Phase 1B 完成：認證系統**
- ✅ Email + 密碼註冊/登入
- ✅ Email 驗證（多種方式）
- ✅ Middleware 路由守衛

### 2025-10-03
- ✅ **Phase 1A 完成：基礎架構**
- ✅ Next.js 15 專案初始化
- ✅ Supabase 配置
- ✅ shadcn/ui 安裝

---

## 🚀 下一步（Phase 2 規劃）

### Phase 2A: 智能複習系統
- [ ] 間隔重複演算法（Spaced Repetition）
- [ ] 複習優先級排序
- [ ] 學習曲線追蹤
- [ ] 自動複習提醒

### Phase 2B: 統計分析
- [ ] 學習進度儀表板
- [ ] 錯題分布圖表（科目、難度、時間）
- [ ] 趨勢分析
- [ ] 匯出報告

### Phase 2C: 搜尋與篩選
- [ ] 全文搜尋（題目、答案、詳解）
- [ ] 多條件篩選（難度、標籤、日期）
- [ ] 排序功能（時間、難度、錯誤次數）
- [ ] 篩選器儲存

### Phase 2D: 進階圖片功能
- [ ] OCR 文字辨識
- [ ] 圖片標註工具
- [ ] 圖片裁切/旋轉
- [ ] 手寫輸入支援

---

## 📝 重要提醒

### 資料夾階層規則
- ✅ **最大深度**: 4 層
- ✅ **檢查邏輯**: 前端 + 後端雙重驗證
- ✅ **刪除行為**: CASCADE（自動刪除子資料夾）

### 圖片上傳規則
- ✅ **數量限制**: 題目 2 張 + 詳解 2 張
- ✅ **格式支援**: JPG, PNG, WEBP, HEIC
- ✅ **大小限制**: 原始 5MB，壓縮後 <1MB
- ✅ **自動流程**: 選擇→壓縮→上傳→同步

### 驗證規則
- ✅ **題目必填**: 圖片 OR 文字（至少一項）
- ✅ **答案必填**: 我的答案 + 正確答案
- ✅ **詳解可選**: 文字 OR 圖片
- ✅ **資料夾必選**: 至少選一個資料夾

### 複習規則
- ✅ **答對**: wrong_count - 1 (最小 0)
- ✅ **答錯**: wrong_count + 1 (無上限)
- ✅ **時間**: last_reviewed_at 自動更新

---

## 🐛 已知問題

### 1. Console.log 過多（中優先級）
- **狀態**: 開發用 log 過多（150+ 處）
- **影響**: Console 雜訊、可能洩漏資訊
- **計劃**: 建立 logger 工具，環境變數控制

### 2. 型別斷言（低優先級）
- **位置**: EditQuestionDialog.tsx
- **狀態**: 使用 `as any` 繞過型別檢查
- **計劃**: 統一 Create/Update 介面

### 3. 圖片清理（低優先級）
- **問題**: 編輯刪除圖片時，Storage 未清理
- **影響**: 空間浪費
- **計劃**: Cron Job 或即時刪除

### 4. TODO 項目（低優先級）
- **FolderContent**: questionCount 顯示 0
- **麵包屑**: 未實作完整路徑
- **計劃**: Phase 2A 實作

---

## 📚 文件索引

- 📄 [README.md](../README.md) - 專案說明
- 📄 [CODE_REVIEW.md](../docs/CODE_REVIEW.md) - Code Review 報告
- 📄 [PHASE_1F_IMAGE_UPLOAD_TESTING.md](../docs/PHASE_1F_IMAGE_UPLOAD_TESTING.md) - 測試指南
- 📄 [PHASE_1F_IMAGE_UPLOAD_COMPLETED.md](../docs/PHASE_1F_IMAGE_UPLOAD_COMPLETED.md) - 完成報告

---

## 🎉 里程碑

### Phase 1 完成（2025-10-05）
- ✨ 完整的 CRUD 功能
- 📸 智能圖片上傳系統
- 🎯 手動複習系統
- ✏️ 編輯功能
- 🔒 企業級安全
- 📱 響應式設計

**總開發時間**: 3 天  
**程式碼行數**: ~15,000+  
**元件數量**: 30+  
**API Routes**: 10+  
**測試案例**: 15+  
**評分**: 90/100 (優秀)

---

**最後更新**: 2025-10-05 21:45  
**當前版本**: v0.3.0-dev  
**開發狀態**: ✅ Phase 1 完成，準備 Phase 2  
**維護人員**: WinnerWang971119
