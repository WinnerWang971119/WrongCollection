# WrongCollection - AI Coding Agent 開發指南

## 📌 專案概述
錯題收集系統，幫助學習者組織和複習錯題。支援**最多4層**的資料夾階層結構。

---

# WrongCollection - AI Coding Agent 開發指南

## 📌 專案概述
錯題收集系統，幫助學習者組織和複習錯題。支援**最多4層**的資料夾階層結構。

---

## 🎯 當前階段：Phase 1A - 基礎架構

### ✅ 已完成
- [x] Next.js 15 + TypeScript ## 🔄 更新日誌

### 2025-10-05
- ✅ **Phase 1C 完成：資料夾管理系統 + Dashboard UX 優化**
- ✅ 資料夾 CRUD 完整功能
  - 創建、編輯、刪除資料夾
  - 4 層階層限制強制執行
  - 樹狀結構顯示與展開/收合
  - 子資料夾 CASCADE 刪除
- ✅ Dashboard 首頁設計（Option F - 卡片網格）
  - 歡迎訊息與漸層標題
  - 兩大功能卡片：錯題登錄、智能複習
  - 四個統計卡片：總錯題、已複習、本周新增、資料夾數
  - 快速開始指南
- ✅ **資料夾內容顯示（Option B - Tab 切換式）**
  - **子資料夾 Tab**：卡片式顯示下一層資料夾，點擊跳轉
  - **錯題本人 Tab**：顯示本資料夾的錯題（不含子資料夾）
  - **全部錯題 Tab**：顯示本資料夾+所有子資料夾的錯題統計
  - Tab 頭顯示數量 Badge
  - 支援「智能複習本層」和「智能複習全部」
- ✅ Sidebar 優化
  - 寬度從 320px 增加到 400px
  - 縮排從每層 20px 增加到 28px
  - 更清晰的階層視覺效果
- ✅ 新增元件
  - SubfoldersTab.tsx - 子資料夾卡片網格
  - QuestionsTab.tsx - 錯題本人顯示（骨架）
  - AllQuestionsTab.tsx - 全部錯題統計（骨架）
  - FolderContent.tsx - Tab 容器與狀態管理
- ✅ Bug 修復
  - @radix-ui/react-icons 依賴安裝
  - RPC 函數參數處理
  - NULL 值 SQL 查詢
  - 子資料夾創建資料傳遞
  - HTML 嵌套錯誤修復
  - has_subfolders 參數名稱
  - NewFolderDialog parent_id 同步

### 2025-10-04
- ✅ **Phase 1B 完成：認證系統**
- ✅ 建立完整的 Email + 密碼認證流程
  - 登入頁面（/app/auth/login/page.tsx）
  - 註冊頁面（/app/auth/signup/page.tsx）
  - Email 驗證路由（/app/auth/confirm/route.ts）
  - 錯誤處理頁面（/app/auth/error/page.tsx）
  - 驗證等待頁面（/app/auth/verify-email/page.tsx）
- ✅ 整合 Supabase Auth
  - Email 驗證使用 verifyOtp API
  - 支援多種驗證方式（PKCE Code、Token Hash、Token）
  - 完整的錯誤處理和日誌追蹤
- ✅ Dashboard 頁面（/app/dashboard/page.tsx）
  - Server Component 取得使用者資訊
  - 登出功能（LogoutButton.tsx）
  - 藍色主題設計
- ✅ Middleware 路由保護（/lib/supabase/middleware.ts）
  - 保護 /dashboard 路由
  - 已登入用戶自動跳轉
  - 詳細的請求日誌
- ✅ 代碼優化
  - 清理 debug log，保留關鍵信息
  - 登入延遲優化至 500ms
  - 統一錯誤訊息格式

### 2025-10-03 (下午)
- ✅ Next.js 15.5.4 專案初始化完成
- ✅ TypeScript + Tailwind CSS 配置完成
- ✅ 開發伺服器成功運行（http://localhost:3000）
- ✅ shadcn/ui 元件庫安裝完成（Button, Card, Input, Form, Label）
- ✅ 測試頁面使用 shadcn/ui 元件正常運作
- ✅ Supabase 客戶端設定完成（client, server, middleware）
- ✅ TypeScript 型別定義建立（database.types.ts）
- ✅ 常數檔案建立（MAX_FOLDER_LEVEL = 4）

### 2025-10-03 (上午)
- 📝 建立專案規劃文件
- 🎯 確定 Phase 1A 範圍：Landing + Auth + Dashboard 骨架
- 🏗️ 確定技術棧：Next.js 15 + Supabase
- ⚙️ 設定資料夾最大層級限制：4 層

---

**最後更新**: 2025-10-05 20:00
**當前版本**: v0.3.0-dev
**開發狀態**: Phase 1C 完成，準備進入 Phase 1D（錯題管理系統）
- [x] shadcn/ui 設定
- [x] Supabase 連接配置
- [ ] Landing Page 完整實作
- [ ] 登入/註冊頁面（Gmail + 密碼）
- [ ] Supabase Auth 整合
- [ ] Dashboard 基本骨架布局
- [ ] 受保護路由機制

### 🚧 進行中
_基礎設置完成，準備開始頁面開發_

### ⏳ 待辦（後續階段）
- Phase 1B: 資料夾管理系統（CRUD、階層結構）
- Phase 1C: 錯題管理系統（新增、查看、編輯）
- Phase 2: 搜尋、篩選、統計功能
- Phase 3: 練習模式

---

## 🏗️ 技術棧

### 前端
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State Management**: React Context / Zustand (按需)

### 後端
- **BaaS**: Supabase
  - Authentication (Email + Password)
  - PostgreSQL Database
  - Storage (圖片上傳)
  - Row Level Security (RLS)

### 部署
- **Platform**: Vercel

---

## 📊 資料模型設計

### Users (由 Supabase Auth 管理)
```sql
auth.users {
  id: uuid (PK)
  email: string
  created_at: timestamp
}
```

### Folders (資料夾)
```sql
folders {
  id: uuid (PK)
  user_id: uuid (FK -> auth.users.id)
  name: string (1-50字元)
  parent_id: uuid (FK -> folders.id, nullable)
  level: integer (1-4, 限制最多4層)
  created_at: timestamp
  updated_at: timestamp
}
```

**重要約束：**
- `level` 欄位限制：1 ≤ level ≤ 4
- 根資料夾：`parent_id = NULL`, `level = 1`
- 子資料夾：`level = parent.level + 1`
- 禁止循環引用

### Questions (錯題)
```sql
questions {
  id: uuid (PK)
  user_id: uuid (FK -> auth.users.id)
  folder_id: uuid (FK -> folders.id)
  question_text: text (題目內容，支援 Markdown)
  my_answer: text
  correct_answer: text
  explanation: text (詳解)
  subject: string (科目，如：數學、英文)
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

## 🎨 頁面結構

### `/` - Landing Page
```
- Hero Section
  - 標題：「輕鬆管理您的錯題本」
  - 副標題：學習路上的最佳夥伴
  - CTA: 立即開始 → /auth/signup
- Features Section
  1. 📁 階層資料夾管理
  2. 📝 結構化錯題記錄
  3. 🎯 智能複習提醒
  4. 📊 學習數據分析
- Footer
```

### `/auth/login` - 登入頁
- Email + Password 表單
- 「還沒有帳號？註冊」連結

### `/auth/signup` - 註冊頁
- Email + Password + Confirm Password
- 「已有帳號？登入」連結

### `/dashboard` - 主控台（需登入）

**未選中資料夾時（首頁）**：
```
+----------------------+---------------------------+
| Top Nav              | Logo | User Menu (Logout) |
+----------------------+---------------------------+
| Sidebar (400px)      | Main Content             |
| - 新增資料夾按鈕      | - 歡迎標題（漸層）        |
| - 資料夾樹狀列表      | - 兩大功能卡片           |
| - 統計資訊           |   • 錯題登錄             |
|                      |   • 智能複習             |
|                      | - 快速統計（4個卡片）    |
|                      | - 快速開始指南           |
+----------------------+---------------------------+
```

**選中資料夾時（Tab 切換式 - Option B）**：
```
+----------------------+---------------------------+
| Top Nav              | Logo | User Menu (Logout) |
+----------------------+---------------------------+
| Sidebar (400px)      | Main Content             |
| - 新增資料夾按鈕      | - 麵包屑 + Level Badge   |
| - 資料夾樹狀列表      | - Tab 導航列             |
| - 統計資訊           |   [子資料夾(3)] [錯題本人(5)] [全部錯題(15)] |
|                      |                           |
|                      | - Tab 內容區             |
|                      |   【子資料夾 Tab】        |
|                      |   卡片網格顯示子資料夾    |
|                      |   點擊卡片跳轉           |
|                      |                           |
|                      |   【錯題本人 Tab】        |
|                      |   只顯示本層錯題         |
|                      |   [新增錯題] [智能複習本層]|
|                      |                           |
|                      |   【全部錯題 Tab】        |
|                      |   本層+子層所有錯題      |
|                      |   [篩選] [智能複習全部]  |
+----------------------+---------------------------+
```

---

## 🔐 認證流程

### 註冊
1. 使用者填寫 email + password
2. 呼叫 `supabase.auth.signUp()`
3. Supabase 發送驗證郵件（可選）
4. 自動登入並跳轉到 `/dashboard`

### 登入
1. 使用者填寫 email + password
2. 呼叫 `supabase.auth.signInWithPassword()`
3. 設定 Session
4. 跳轉到 `/dashboard`

### 登出
1. 呼叫 `supabase.auth.signOut()`
2. 清除 Session
3. 跳轉到 `/`

### 路由保護
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = request.cookies.get('supabase-auth-token')
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}
```

---

## 📁 專案結構

```
/app
  /(public)
    /page.tsx                    # Landing Page
    /auth
      /login/page.tsx            # 登入頁
      /signup/page.tsx           # 註冊頁
  /(protected)
    /dashboard
      /page.tsx                  # Dashboard 主頁 (Server Component)
      /DashboardContent.tsx      # Dashboard 內容 (Client Component)
      /LogoutButton.tsx          # 登出按鈕
  /api
    /folders
      /route.ts                  # GET, POST folders
      /[id]/route.ts             # PATCH, DELETE folder
/components
  /ui/                           # shadcn/ui 元件
  /folders/
    /FolderTree.tsx              # 資料夾樹狀列表
    /FolderItem.tsx              # 單個資料夾項目
    /FolderContent.tsx           # 資料夾內容容器（Tab）
    /SubfoldersTab.tsx           # 子資料夾 Tab
    /QuestionsTab.tsx            # 錯題本人 Tab（骨架）
    /AllQuestionsTab.tsx         # 全部錯題 Tab（骨架）
    /NewFolderDialog.tsx         # 新增資料夾對話框
    /EditFolderDialog.tsx        # 編輯資料夾對話框
    /DeleteFolderDialog.tsx      # 刪除資料夾對話框
    /index.ts                    # 統一導出
/lib
  /supabase/
    /client.ts                   # Client Component 用
    /server.ts                   # Server Component 用
    /middleware.ts               # Middleware 用
  /api/
    /folder.api.ts               # 資料夾 API 客戶端
  /constants/
    /folder.constants.ts         # 資料夾常數（MAX_LEVEL=4）
  /validations/
    /folder.validation.ts        # Zod 驗證 schema
/types
  /folder.types.ts               # 資料夾型別定義
/supabase
  /migrations/
    /001_create_folders_table.sql # 資料夾表 SQL
```

---

## 🎯 資料夾內容顯示設計（Option B - Tab 切換式）

### Tab 結構
選中資料夾後，顯示三個 Tab：

1. **子資料夾 Tab**（預設）
   - 用途：顯示當前資料夾的下一層子資料夾
   - 布局：卡片網格（3-4 列）
   - 每個卡片顯示：
     - 資料夾名稱
     - Level Badge
     - 題目數量（Phase 1D 實作）
     - 子資料夾數量（如有）
     - 「進入」按鈕
   - 點擊卡片：跳轉到該資料夾
   - 空狀態：顯示「此資料夾沒有子資料夾」+ 新增按鈕
   - 操作：[+ 新增子資料夾] 按鈕（如未達 Level 4）

2. **錯題本人 Tab**
   - 用途：只顯示**本資料夾**的錯題（不含子資料夾）
   - 布局：列表式錯題卡片
   - 每個卡片顯示：
     - 題目預覽
     - 難度星星
     - 錯誤次數
     - 最後複習時間
     - 標籤
   - 操作：
     - [+ 新增錯題] - 跳轉到錯題表單
     - [🎯 智能複習本層] - 開始複習本資料夾錯題
   - 空狀態：顯示「此資料夾還沒有錯題」+ 記錄小技巧
   - **骨架版本**：目前僅顯示空狀態和按鈕，Phase 1D 實作完整功能

3. **全部錯題 Tab**
   - 用途：顯示**本資料夾 + 所有子資料夾**的錯題
   - 布局：按資料夾分組顯示
   - 統計卡片（3個）：
     - 總題數（藍色）
     - 已複習（綠色）
     - 待複習（橙色）
   - 操作：
     - [🔍 篩選] - 按難度、標籤、複習狀態篩選
     - [🎯 智能複習全部] - 複習所有子資料夾的錯題
   - 空狀態：顯示「此資料夾及子資料夾都沒有錯題」+ 功能說明
   - **骨架版本**：目前僅顯示統計和空狀態，Phase 1D 實作完整功能

### Tab 切換邏輯
- 預設顯示：「錯題本人」Tab
- Badge 數量提示：每個 Tab 標籤顯示項目數量
- 自動切換：點擊子資料夾卡片後，跳轉到該資料夾並重置為「錯題本人」Tab

### 麵包屑導航
- 顯示當前資料夾名稱
- 顯示 Level Badge（如：Level 2）
- TODO Phase 1D：實作完整路徑（數學 > 代數 > 二次方程式）

---

## 🎯 開發規範

### 命名規則
- **元件**: PascalCase (`FolderTree.tsx`)
- **函數/變數**: camelCase (`getUserFolders`)
- **常數**: UPPER_SNAKE_CASE (`MAX_FOLDER_LEVEL`)
- **CSS類別**: kebab-case (Tailwind)

### 資料夾階層規則
- **最大深度**: 4 層
- **檢查邏輯**:
  ```typescript
  const MAX_FOLDER_LEVEL = 4;
  
  async function canCreateSubfolder(parentId: string): Promise<boolean> {
    const parent = await getFolder(parentId);
    return parent.level < MAX_FOLDER_LEVEL;
  }
  ```

### Supabase RLS 策略
```sql
-- Folders: 使用者只能存取自己的資料夾
CREATE POLICY "Users can CRUD own folders"
ON folders FOR ALL
USING (auth.uid() = user_id);

-- Questions: 使用者只能存取自己的錯題
CREATE POLICY "Users can CRUD own questions"
ON questions FOR ALL
USING (auth.uid() = user_id);
```

---

## 🚀 開發流程

### 本地開發
```bash
npm run dev          # 啟動開發伺服器 (http://localhost:3000)
npm run build        # 建置專案
npm run lint         # 程式碼檢查
```

### 環境變數 (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📝 重要提醒

1. **始終檢查資料夾層級** - 禁止超過 4 層
2. **使用 Supabase RLS** - 確保資料安全
3. **錯誤處理** - 所有 API 呼叫都要 try-catch
4. **Loading 狀態** - 異步操作顯示載入指示器
5. **表單驗證** - 使用 Zod + React Hook Form
6. **響應式設計** - 支援手機、平板、桌面

---

## 🔄 更新日誌

### 2025-10-03 (下午)
- ✅ Next.js 15.5.4 專案初始化完成
- ✅ TypeScript + Tailwind CSS 配置完成
- ✅ 開發伺服器成功運行（http://localhost:3000）
- � 正在安裝 shadcn/ui 元件庫

### 2025-10-03 (上午)
- �📝 建立專案規劃文件
- 🎯 確定 Phase 1A 範圍：Landing + Auth + Dashboard 骨架
- 🏗️ 確定技術棧：Next.js 15 + Supabase
- ⚙️ 設定資料夾最大層級限制：4 層

---

**最後更新**: 2025-10-03 16:00
**當前版本**: v0.1.0-dev
**開發狀態**: Phase 1A 進行中（Task 2/4 完成）
