# 📚 WrongCollection - 錯題收集系統

> 學習路上的最佳夥伴，輕鬆管理您的錯題本

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

---

## 🎯 專案簡介

**WrongCollection** 是一個現代化的錯題管理系統，幫助學習者有效組織和複習錯題。透過直觀的階層式資料夾結構和結構化的錯題記錄，讓學習更有效率。

### ✨ 核心特色

- 📁 **階層式資料夾管理** - 支援最多 4 層的資料夾結構，含完整 CRUD 功能
- 📝 **結構化錯題記錄** - 包含題目、我的答案、正確答案、詳解
- 🔐 **完整認證系統** - Email + 密碼註冊/登入，含 Email 驗證
- 🎨 **現代化 UI 設計** - 藍色主題，漸層效果，響應式設計
- ⚡ **即時 UI 更新** - 所有操作立即反應，無需手動刷新
- 🔒 **資料安全** - 使用 Supabase Row Level Security (RLS)

---

## 🚀 快速開始

### 前置需求

- **Node.js**: 18.x 或以上
- **npm**: 9.x 或以上
- **Supabase 帳號**: [免費註冊](https://supabase.com/)

### 安裝步驟

1. **Clone 專案**

```bash
git clone https://github.com/WinnerWang971119/WrongCollection.git
cd WrongCollection
```

2. **安裝依賴**

```bash
npm install
```

3. **設定環境變數**

創建 `.env.local` 檔案：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> 💡 從 Supabase Dashboard → Settings → API 取得這些值

4. **配置 Supabase**

在 Supabase Dashboard 進行以下設定：

**a. 設定 Redirect URLs**
- 前往 `Authentication → URL Configuration`
- **Site URL**: `http://localhost:3000`
- **Redirect URLs** 添加:
  - `http://localhost:3000/auth/confirm`
  - `http://localhost:3000/auth/callback`

**b. 執行 SQL 腳本**
- 前往 `SQL Editor` → `New query`
- 複製並執行 `supabase/migrations/001_create_folders_table.sql` 的內容來建立 `folders` 表格和相關函數。

**c. 修改 Email 模板（可選）**
- 前往 `Authentication → Email Templates`
- 選擇 `Confirm signup`
- 修改驗證連結為：
  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">確認您的 Email</a>
  ```

5. **啟動開發伺服器**

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 🎉

---

## 📖 功能說明

### ✅ 已完成功能（Phase 1C）

#### 🔐 認證系統
- **註冊/登入/登出** (`/auth/*`)
- **Email 驗證** (`/auth/confirm`)
- **路由保護** (Middleware)

#### 🏠 Dashboard
- **歡迎頁面**：功能卡片、統計數據、快速指南
- **響應式布局**

#### � 資料夾管理系統
- **完整 CRUD**：新增、編輯、刪除資料夾
- **樹狀結構顯示**：在側邊欄以樹狀顯示，支援展開/收合
- **4 層階層限制**：前端和後端雙重驗證
- **階層式刪除**：刪除父資料夾時，可選擇一併刪除所有子資料夾
- **即時更新**：所有操作都會即時反應在 UI 上，無需刷新頁面

#### 📂 資料夾內容顯示
- **Tab 式介面**：
  - **子資料夾 Tab**：卡片式顯示下一層資料夾
  - **錯題本人 Tab**：顯示本資料夾的錯題（骨架）
  - **全部錯題 Tab**：顯示本資料夾及所有子層的錯題（骨架）
- **麵包屑導航**：顯示當前資料夾路徑

### 🚧 開發中功能

#### Phase 1D - 錯題管理系統
- [ ] 新增/編輯/刪除錯題
- [ ] 錯題卡片顯示
- [ ] 圖片上傳功能

#### Phase 2 - 進階功能
- [ ] 搜尋與篩選
- [ ] 統計分析
- [ ] 練習模式

---

## 🛠️ 技術棧

### 前端
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Form**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **State Management**: React `useState`, `useEffect`

### 後端
- **BaaS**: [Supabase](https://supabase.com/)
  - PostgreSQL 資料庫
  - Authentication (Email + Password)
  - Row Level Security (RLS)
  - Storage (圖片上傳)
  - Edge Functions (未來可能使用)

### 開發工具
- **Package Manager**: npm
- **Code Quality**: ESLint + Prettier
- **Version Control**: Git + GitHub

---

## 📁 專案結構

```
WrongCollection/
├── app/                          # Next.js App Router
│   ├── (public)/                 # 公開頁面
│   │   ├── page.tsx              # Landing Page
│   │   └── auth/                 # 認證頁面
│   ├── (protected)/
│   │   └── dashboard/            # 受保護頁面
│   │       ├── page.tsx
│   │       └── DashboardContent.tsx
│   ├── api/
│   │   └── folders/              # 資料夾 API
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/                   # React 元件
│   ├── folders/                  # 資料夾相關元件
│   │   ├── FolderTree.tsx
│   │   ├── FolderContent.tsx
│   │   ├── NewFolderDialog.tsx
│   │   └── ...
│   └── ui/                       # shadcn/ui 元件
├── lib/                          # 工具函數
│   ├── api/
│   │   └── folder.api.ts         # 資料夾 API 客戶端
│   ├── constants/
│   │   └── folder.constants.ts   # 資料夾常數
│   ├── supabase/                 # Supabase 配置
│   └── validations/
│       └── folder.validation.ts  # Zod 驗證
├── supabase/                     # Supabase migrations
│   └── migrations/
│       └── 001_create_folders_table.sql
├── types/                        # TypeScript 型別
│   └── folder.types.ts
├── middleware.ts                 # Next.js Middleware
├── .env.local                    # 環境變數（需自行創建）
└── README.md                     # 專案說明
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

**重要約束：**
- `level` 必須介於 1 到 4 之間
- 根資料夾：`parent_id = NULL`, `level = 1`
- 子資料夾：`level = parent.level + 1`
- `ON DELETE CASCADE` on `parent_id`

### Questions（錯題）
```sql
questions {
  id: uuid (PK)
  user_id: uuid (FK -> auth.users.id)
  folder_id: uuid (FK -> folders.id)
  question_text: text (題目內容，支援 Markdown)
  my_answer: text
  correct_answer: text
  explanation: text (詳解)
  subject: string (科目)
  tags: string[] (章節標籤)
  difficulty: enum('easy', 'medium', 'hard')
  wrong_count: integer (default: 1)
  last_reviewed_at: timestamp (nullable)
  images: string[] (圖片 URL)
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 🔐 環境變數說明

| 變數名稱 | 說明 | 取得方式 |
|---------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名金鑰 | 同上 |

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
```

---

## 🚀 部署

### Vercel（推薦）

1. 前往 [Vercel](https://vercel.com/)
2. 連接 GitHub Repository
3. 設定環境變數
4. 部署！

### 其他平台

專案支援任何支援 Next.js 的平台：
- Netlify
- AWS Amplify
- Cloudflare Pages

---

## 🤝 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. Commit 變更 (`git commit -m 'Add some AmazingFeature'`)
4. Push 到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

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

---

## 📮 聯絡我們

如有問題或建議，請：
- 開啟 [Issue](https://github.com/WinnerWang971119/WrongCollection/issues)
- 發送 Email 到 wangdiego1119@gmail.com

---

<div align="center">

**⭐ 如果這個專案對你有幫助，請給一個星星！⭐**

Made with ❤️ by WinnerWang971119

</div>
