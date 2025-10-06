# 📚 WrongCollection - 智能錯題收集系統

> 學習路上的最佳夥伴，用科技讓複習更高效 🚀

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 專案簡介

**WrongCollection** 是一個現代化、功能完整的智能錯題管理系統，專為學習者打造。透過直觀的 4 層資料夾架構、智能圖片上傳、結構化錯題記錄，以及強大的複習功能，讓您的學習事半功倍。

### ✨ 核心特色

- 📁 **4 層資料夾架構** - 完整的 CRUD 功能，樹狀顯示，智能階層管理
- 📝 **結構化錯題記錄** - 題目、答案、詳解、難度、標籤一應俱全
- 📸 **智能圖片上傳** - 自動壓縮、多圖上傳（2+2）、拖曳支援
- 🎯 **手動複習系統** - 答對/答錯計數、錯誤次數追蹤、複習時間記錄
- ✏️ **編輯功能** - 完整的錯題編輯，支援圖片新增/刪除/管理
- 🔐 **完整認證系統** - Email + 密碼，含 Email 驗證
- ⚡ **即時 UI 更新** - 所有操作立即反應，無需手動刷新
- 🎨 **現代化 UI** - 藍色主題、漸層效果、響應式設計、鍵盤快捷鍵
- 🔒 **企業級安全** - Supabase RLS、輸入驗證、Storage 權限控制

---

## 🚀 快速開始

### 前置需求

- **Node.js**: 18.x 或以上
- **npm**: 9.x 或以上
- **Supabase 帳號**: [免費註冊](https://supabase.com/)

### 安裝步驟

#### 1. Clone 專案

```bash
git clone https://github.com/WinnerWang971119/WrongCollection.git
cd WrongCollection
```

#### 2. 安裝依賴

```bash
npm install
```

#### 3. 設定環境變數

創建 `.env.local` 檔案：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> 💡 從 Supabase Dashboard → Settings → API 取得這些值

#### 4. 配置 Supabase

**a. 設定 Redirect URLs**
- 前往 `Authentication → URL Configuration`
- **Site URL**: `http://localhost:3000`
- **Redirect URLs** 添加:
  - `http://localhost:3000/auth/confirm`
  - `http://localhost:3000/auth/callback`

**b. 執行 SQL Migrations**
- 前往 `SQL Editor` → `New query`
- 依序執行以下 Migration 腳本：
  1. `supabase/migrations/001_create_folders_table.sql` - 資料夾表和 RLS
  2. `supabase/migrations/002_create_questions_table.sql` - 錯題表和關聯
  3. `supabase/migrations/003_add_image_fields.sql` - 圖片欄位和 Storage

**c. 建立 Storage Bucket**
- 前往 `Storage` → `New bucket`
- **Name**: `question-images`
- **Public**: ✅ 勾選
- **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/heic`
- **Max file size**: `5MB`

**d. 設定 Storage RLS 政策**
- 點擊 `question-images` bucket → `Policies` → `New policy`
- 複製 `003_add_image_fields.sql` 中的 Storage policies 並執行

**e. 修改 Email 模板（可選）**
- 前往 `Authentication → Email Templates`
- 選擇 `Confirm signup`
- 修改驗證連結為：
  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">確認您的 Email</a>
  ```

#### 5. 啟動開發伺服器

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 🎉

---

## 📖 功能說明

### ✅ Phase 1: 核心功能（已完成）

#### 🔐 Phase 1B: 認證系統
- ✅ **註冊/登入/登出** (`/auth/*`)
- ✅ **Email 驗證** (`/auth/confirm`)
- ✅ **多種驗證方式**：PKCE、Token Hash、Token
- ✅ **路由保護** (Middleware)
- ✅ **錯誤處理** (錯誤頁面)

#### 🏠 Phase 1A: Dashboard
- ✅ **歡迎頁面**：功能卡片、統計數據、快速指南
- ✅ **響應式布局**：支援手機、平板、桌面
- ✅ **藍色主題**：漸層效果、現代化設計

#### 📁 Phase 1C: 資料夾管理系統
- ✅ **完整 CRUD**：新增、編輯、刪除資料夾
- ✅ **樹狀結構顯示**：在側邊欄以樹狀顯示，支援展開/收合
- ✅ **4 層階層限制**：前端和後端雙重驗證，防止超過限制
- ✅ **CASCADE 刪除**：刪除父資料夾時，自動刪除所有子資料夾
- ✅ **即時更新**：所有操作都會即時反應在 UI 上
- ✅ **資料夾內容顯示**：Tab 切換式介面（子資料夾、錯題本人、全部錯題）

#### 📝 Phase 1D: 錯題管理系統
- ✅ **新增錯題**：3 步驟表單（基本資訊、答案內容、選擇資料夾）
- ✅ **查看錯題**：詳情對話框、多欄位顯示、麵包屑路徑
- ✅ **編輯錯題**：載入現有資料、支援修改所有欄位
- ✅ **刪除錯題**：確認對話框、連帶刪除 Storage 圖片
- ✅ **難度標記**：簡單、中等、困難（星星顯示）
- ✅ **多資料夾歸屬**：一題可加入多個資料夾

#### 🎯 Phase 1E: 手動複習系統
- ✅ **答對/答錯按鈕**：Space 顯示答案、← 答錯、→ 答對
- ✅ **錯誤次數追蹤**：答對 -1、答錯 +1、最小值 0
- ✅ **複習時間記錄**：last_reviewed_at 自動更新
- ✅ **鍵盤快捷鍵**：提升複習效率
- ✅ **統計資訊顯示**：錯誤次數、最後複習時間、創建時間

#### 📸 Phase 1F: 圖片上傳系統
- ✅ **2+2 圖片架構**：題目最多 2 張、詳解最多 2 張
- ✅ **自動壓縮**：大圖自動壓縮到 1MB 以下（1920px）
- ✅ **自動上傳**：選擇圖片後自動壓縮並上傳到 Supabase Storage
- ✅ **拖曳上傳**：支援拖曳檔案到上傳區
- ✅ **多圖顯示**：網格布局、單圖佔滿、雙圖左右分列
- ✅ **圖片管理**：新增、刪除、排序、預覽、點擊放大
- ✅ **Storage 整合**：Public bucket、RLS 政策、URL 生成
- ✅ **編輯支援**：載入現有圖片、新增/刪除圖片

### ✅ Phase 2: 進階功能（進行中）

#### 🎯 Phase 2A: SM-2 智能複習系統（已完成）
- ✅ **Supermemo-2 演算法**：科學間隔重複
- ✅ **複習佇列**：today、tomorrow、this_week、later
- ✅ **5 級評分系統**：1-5 分自我評估
- ✅ **自動排程**：根據 EF 值動態調整複習間隔
- ✅ **複習狀態追蹤**：new、learning、review、mastered

#### 📊 Phase 2B: 統計視覺化（已完成）
- ✅ **複習熱力圖**：365 天活動紀錄，類似 GitHub Contributions
- ✅ **統計卡片**：總題數、精熟題數、今日複習、連續天數
- ✅ **複習佇列可視化**：today、tomorrow、this_week、later 計數
- ✅ **難度分布**：簡單/中等/困難錯題統計

#### 📈 Phase 2C: 進階分析系統（已完成）
- ✅ **錯題分布分析**：按資料夾、難度分組的圓餅圖
- ✅ **學習進度追蹤**：new/learning/review/mastered 折線圖
- ✅ **記憶強度趨勢**：easiness_factor 面積圖（1.3-2.5）
- ✅ **複習效率統計**：正確率、平均品質、精熟比例
- ✅ **時間範圍切換**：7/30/90/全部天數
- ✅ **動態日期範圍**：「全部」自動從首題日期開始

#### 🎨 Phase 2D: AI 圖片智能處理（開發中）
- 🔄 **智能裁切**：自動框選題目區域（OpenCV.js）
- 🔄 **透視校正**：自動擺正傾斜照片（OpenCV.js）
- 🔄 **白底黑字標準化**：去光差、統一格式（OpenCV.js）
- 🔄 **對比度增強**：讓模糊圖片更清晰（CLAHE）
- ⏳ **AI 移除筆跡**：自動檢測並移除手寫答案（Replicate API）
- ⏳ **OCR 文字辨識**：圖片轉文字，支援繁中（Google Vision）

### 🎯 Phase 3: 社群功能（未來）
- [ ] 錯題集分享
- [ ] 匯出 PDF
- [ ] 好友系統
- [ ] 討論區

---

## 🎨 介面預覽

### Dashboard 首頁
- 🎴 功能卡片（錯題登錄、智能複習）
- 📊 統計卡片（總錯題、已複習、本周新增、資料夾數）
- 📖 快速開始指南

### 資料夾管理
- 🌳 樹狀資料夾列表（Sidebar 400px）
- 📑 Tab 切換式內容顯示
- 🎯 子資料夾卡片網格
- 📝 錯題列表（本層/全部）

### 錯題管理
- ✏️ 3 步驟新增表單
- 🔍 詳情對話框
- ✏️ 3 步驟編輯表單
- 🗑️ 確認刪除對話框

### 複習介面
- 📖 題目卡片（藍色）
- ❌ 我的答案（紅色）
- ✅ 正確答案（綠色）
- 💡 詳解（紫色）
- ⌨️ 鍵盤快捷鍵提示

---

## 🛠️ 技術棧

### 前端
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Form**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Image Compression**: [browser-image-compression](https://www.npmjs.com/package/browser-image-compression)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Icons**: [Lucide React](https://lucide.dev/)

### 後端
- **BaaS**: [Supabase](https://supabase.com/)
  - PostgreSQL 資料庫
  - Authentication (Email + Password)
  - Row Level Security (RLS)
  - Storage (圖片上傳)
  - Edge Functions (未來可能使用)

### 開發工具
- **Package Manager**: npm
- **Code Quality**: ESLint + TypeScript
- **Version Control**: Git + GitHub
- **Deployment**: Vercel (推薦)

---

## 📁 專案結構

```
WrongCollection/
├── app/                          # Next.js App Router
│   ├── (public)/                 # 公開頁面
│   │   ├── page.tsx              # Landing Page
│   │   └── auth/                 # 認證頁面
│   │       ├── login/
│   │       ├── signup/
│   │       ├── confirm/
│   │       ├── callback/
│   │       └── error/
│   ├── (protected)/
│   │   └── dashboard/            # 受保護頁面
│   │       ├── page.tsx
│   │       ├── DashboardContent.tsx
│   │       └── LogoutButton.tsx
│   ├── api/                      # API Routes
│   │   ├── folders/              # 資料夾 API
│   │   ├── questions/            # 錯題 API
│   │   └── upload/               # 圖片上傳 API
│   ├── layout.tsx
│   └── globals.css
├── components/                   # React 元件
│   ├── folders/                  # 資料夾相關元件
│   │   ├── FolderTree.tsx
│   │   ├── FolderContent.tsx
│   │   ├── SubfoldersTab.tsx
│   │   ├── QuestionsTab.tsx
│   │   ├── AllQuestionsTab.tsx
│   │   ├── NewFolderDialog.tsx
│   │   ├── EditFolderDialog.tsx
│   │   ├── DeleteFolderDialog.tsx
│   │   └── index.ts
│   ├── questions/                # 錯題相關元件
│   │   ├── NewQuestionDialog.tsx
│   │   ├── EditQuestionDialog.tsx
│   │   ├── QuestionDetailDialog.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── Step1BasicInfo.tsx
│   │   ├── Step2Answer.tsx
│   │   ├── Step3Folders.tsx
│   │   └── index.ts
│   └── ui/                       # shadcn/ui 元件
│       ├── multi-image-upload.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       └── ...
├── lib/                          # 工具函數
│   ├── api/                      # API 客戶端
│   │   ├── folder.api.ts
│   │   ├── question.api.ts
│   │   └── image.api.ts
│   ├── constants/
│   │   └── folder.constants.ts
│   ├── supabase/                 # Supabase 配置
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── middleware.ts
│   │   └── storage.ts
│   └── validations/              # Zod 驗證
│       ├── folder.validation.ts
│       └── question.validation.ts
├── supabase/                     # Supabase migrations
│   └── migrations/
│       ├── 001_create_folders_table.sql
│       ├── 002_create_questions_table.sql
│       └── 003_add_image_fields.sql
├── types/                        # TypeScript 型別
│   ├── folder.types.ts
│   ├── question.types.ts
│   └── database.types.ts
├── docs/                         # 文件
│   ├── CODE_REVIEW.md
│   ├── PHASE_1F_IMAGE_UPLOAD_TESTING.md
│   └── ...
├── middleware.ts                 # Next.js Middleware
├── .env.local                    # 環境變數（需自行創建）
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🗃️ 資料庫結構

### Users（由 Supabase Auth 管理）
```sql
auth.users {
  id: uuid (PK)
  email: string
  created_at: timestamp
}
```

### Folders（資料夾）
```sql
folders {
  id: uuid (PK)
  user_id: uuid (FK -> auth.users.id)
  name: string (1-50 字元)
  parent_id: uuid (FK -> folders.id, nullable)
  level: integer (1-4, 限制最多 4 層)
  created_at: timestamp
  updated_at: timestamp
}
```

**約束：**
- `level` 必須介於 1 到 4
- 根資料夾：`parent_id = NULL`, `level = 1`
- 子資料夾：`level = parent.level + 1`
- `ON DELETE CASCADE` on `parent_id`

### Questions（錯題）
```sql
questions {
  id: uuid (PK)
  user_id: uuid (FK -> auth.users.id)
  title: string (錯題標題)
  question_text: text (題目內容)
  question_images: text[] (題目圖片路徑陣列, max 2)
  my_answer: text (我的答案)
  correct_answer: text (正確答案)
  explanation: text (詳解)
  explanation_images: text[] (詳解圖片路徑陣列, max 2)
  difficulty: enum('easy', 'medium', 'hard')
  wrong_count: integer (錯誤次數, default: 1)
  last_reviewed_at: timestamp (最後複習時間)
  created_at: timestamp
  updated_at: timestamp
}
```

### Question_Folders（錯題-資料夾關聯）
```sql
question_folders {
  question_id: uuid (FK -> questions.id)
  folder_id: uuid (FK -> folders.id)
  created_at: timestamp
  PRIMARY KEY (question_id, folder_id)
}
```

---

## 📸 圖片上傳系統

### Storage 架構
- **Bucket**: `question-images` (Public)
- **路徑格式**: `{user_id}/temp_{timestamp}_{type}_{index}.{ext}`
- **支援格式**: JPG, PNG, WEBP, HEIC
- **檔案大小**: 最大 5MB（壓縮後 <1MB）
- **圖片數量**: 題目 2 張 + 詳解 2 張

### 上傳流程
1. **選擇檔案**：點擊或拖曳
2. **驗證檔案**：格式、大小、數量
3. **自動壓縮**：1MB、1920px
4. **自動上傳**：Upload to Storage
5. **自動同步**：Update form paths
6. **提交表單**：Save to database

### RLS 政策
- **Upload**: 只能上傳到自己的資料夾
- **Read**: 所有人可讀（Public bucket）
- **Delete**: 只能刪除自己的圖片

---

## 🔐 安全性

### 認證層
- ✅ Email + 密碼認證
- ✅ Email 驗證（OTP）
- ✅ Session 管理
- ✅ Middleware 路由守衛

### 資料層
- ✅ Row Level Security (RLS)
- ✅ 使用者只能存取自己的資料
- ✅ CASCADE 刪除保護
- ✅ Foreign Key 約束

### 輸入層
- ✅ Zod Schema 驗證
- ✅ 前端 + 後端雙重驗證
- ✅ XSS 防護（React 自動轉義）
- ✅ SQL 注入防護（Supabase ORM）

### Storage 層
- ✅ 檔案格式驗證
- ✅ 檔案大小限制
- ✅ 路徑隔離（user_id）
- ✅ RLS 政策保護

---

## 📝 開發腳本

```bash
# 開發模式
npm run dev

# 建置生產版本
npm run build

# 啟動生產伺服器
npm start

# 程式碼檢查
npm run lint

# 型別檢查
npx tsc --noEmit
```

---

## 🚀 部署

### Vercel（推薦）

1. 前往 [Vercel](https://vercel.com/)
2. 連接 GitHub Repository
3. 設定環境變數：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 部署！

### 其他平台

支援任何支援 Next.js 的平台：
- **Netlify**
- **AWS Amplify**
- **Cloudflare Pages**
- **Railway**
- **Render**

---

## 🧪 測試

詳細測試指南請參考：[`docs/PHASE_1F_IMAGE_UPLOAD_TESTING.md`](docs/PHASE_1F_IMAGE_UPLOAD_TESTING.md)

### 測試清單
- ✅ 新增錯題（含圖片）
- ✅ 查看錯題（多圖顯示）
- ✅ 編輯錯題（圖片管理）
- ✅ 刪除錯題（Storage 清理）
- ✅ 圖片壓縮
- ✅ 檔案驗證
- ✅ 錯誤處理

---

## 📚 文件

- 📄 [Code Review 報告](docs/CODE_REVIEW.md)
- 📄 [圖片上傳測試指南](docs/PHASE_1F_IMAGE_UPLOAD_TESTING.md)
- 📄 [圖片上傳完成報告](docs/PHASE_1F_IMAGE_UPLOAD_COMPLETED.md)
- 📄 [AI 開發指南](.github/copilot-instructions.md)

---

## 🤝 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. Commit 變更 (`git commit -m 'Add some AmazingFeature'`)
4. Push 到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 貢獻規範
- 遵循 TypeScript 和 ESLint 規範
- 使用清晰的 Commit 訊息
- 新增功能需包含文件
- 測試後再提交 PR

---

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

---

## 👤 作者

**WinnerWang971119**

- GitHub: [@WinnerWang971119](https://github.com/WinnerWang971119)
- Email: wangdiego1119@gmail.com

---

## 🙏 致謝

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 後端服務
- [shadcn/ui](https://ui.shadcn.com/) - UI 元件庫
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [browser-image-compression](https://www.npmjs.com/package/browser-image-compression) - 圖片壓縮
- [Zod](https://zod.dev/) - Schema 驗證
- [Lucide](https://lucide.dev/) - Icon 庫

---

## 📮 聯絡我們

如有問題或建議，請：
- 開啟 [Issue](https://github.com/WinnerWang971119/WrongCollection/issues)
- 發送 Email 到 wangdiego1119@gmail.com
- 查看 [文件](docs/)

---

## 📊 專案統計

- **程式碼行數**: ~15,000+
- **元件數量**: 30+
- **API Routes**: 10+
- **測試案例**: 15+
- **開發時間**: 3 天（Phase 1 完整實作）
- **版本**: v0.3.0-dev

---

## 🎉 版本歷史

### v0.3.0-dev (2025-10-05)
- ✅ **Phase 1F 完成**：圖片上傳系統
- ✅ **Phase 1E 完成**：手動複習系統
- ✅ **Phase 1D 完成**：錯題管理系統
- ✅ **編輯功能**：完整的錯題編輯
- ✅ **Code Review**：程式碼品質審查

### v0.2.0-dev (2025-10-04)
- ✅ **Phase 1C 完成**：資料夾管理系統
- ✅ **Phase 1B 完成**：認證系統

### v0.1.0-dev (2025-10-03)
- ✅ **Phase 1A 完成**：專案初始化
- ✅ Next.js 15 + TypeScript 設定
- ✅ Supabase 整合

---

<div align="center">

**⭐ 如果這個專案對你有幫助，請給一個星星！⭐**

Made with ❤️ by WinnerWang971119

</div>
