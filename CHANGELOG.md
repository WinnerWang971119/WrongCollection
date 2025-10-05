# Changelog

所有值得注意的變更都會記錄在這個檔案中。

格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，  
本專案遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

---

## [0.3.0-dev] - 2025-10-05

### ✨ 新增功能

#### Phase 1F: 圖片上傳系統
- **2+2 圖片架構**：題目最多 2 張、詳解最多 2 張
- **自動壓縮**：使用 browser-image-compression，壓縮到 1MB (1920px)
- **自動上傳**：選擇圖片後自動壓縮並上傳到 Supabase Storage
- **拖曳上傳**：支援拖曳檔案到上傳區域
- **多圖顯示**：單圖佔滿寬度、雙圖左右分列（grid-cols-2）
- **圖片管理**：新增、刪除、排序、預覽、點擊放大
- **Storage 整合**：
  - 建立 `question-images` Public bucket
  - 設定 RLS 政策（只能上傳/刪除自己的圖片）
  - 自動生成 Public URL

#### Phase 1E: 手動複習系統  
- **鍵盤快捷鍵**：
  - `Space`：顯示/隱藏答案
  - `←`：答錯（wrong_count +1）
  - `→`：答對（wrong_count -1，最小 0）
- **錯誤次數追蹤**：自動計算並顯示
- **複習時間記錄**：last_reviewed_at 自動更新
- **統計資訊**：顯示錯誤次數、最後複習時間、創建時間

#### Phase 1G: 編輯功能
- **EditQuestionDialog 元件**：完整的 3 步驟編輯表單
- **載入現有資料**：自動填入所有欄位
- **圖片編輯支援**：
  - 載入現有圖片並顯示
  - 支援刪除現有圖片
  - 支援新增新圖片（自動上傳）
  - 支援圖片順序調整
- **整合到 QuestionsTab**：點擊「編輯」按鈕開啟編輯對話框

### 🔧 修復

#### 圖片上傳 Bug 修復
- **根本原因**：MultiImageUpload 元件只有檔案選擇和預覽，從未實際上傳
- **解決方案**：
  - 在 MultiImageUpload 新增 useEffect 自動上傳邏輯
  - 在 NewQuestionDialog 新增 useEffect 自動同步路徑到表單
  - 簡化 validateStep 和 onSubmit 邏輯
- **修復內容**：
  - 驗證仍要求文字（圖片路徑未同步）
  - 資料庫空陣列（MultiImageUpload 未上傳）
  - 圖片顯示 404（未轉換 Public URL）

#### 圖片顯示 Bug 修復
- **問題**：QuestionDetailDialog 直接使用 Storage 路徑導致 404
- **解決**：使用 `getImagePublicUrl()` 轉換為完整 URL
- **布局優化**：單張圖片佔滿寬度、雙張圖片左右分列

### 📝 文件

- **README.md**：完全重寫，包含所有新功能
- **CODE_REVIEW.md**：完整的程式碼審查報告（90/100）
- **PHASE_1F_IMAGE_UPLOAD_TESTING.md**：15 個測試案例指南
- **copilot-instructions.md**：更新開發指南

### 🎨 優化

- **上傳狀態顯示**：
  - "✓ 已成功上傳 X 張圖片"（綠色）
  - "⏳ 上傳中..."（藍色，含 spinner）
- **Console 日誌優化**：新增詳細的上傳流程日誌
- **錯誤處理**：完整的 Toast 通知和錯誤訊息

---

## [0.2.0-dev] - 2025-10-04

### ✨ 新增功能

#### Phase 1D: 錯題管理系統
- **NewQuestionDialog**：3 步驟新增表單
  - Step 1：基本資訊（標題、題目文字、題目圖片 URL）
  - Step 2：答案內容（我的答案、正確答案、詳解、詳解圖片 URL、難度）
  - Step 3：選擇資料夾（多選）
- **QuestionDetailDialog**：詳情顯示對話框
  - 題目卡片（藍色）
  - 我的答案（紅色）
  - 正確答案（綠色）
  - 詳解（紫色）
  - 統計資訊
- **QuestionCard**：錯題卡片元件
  - 星星顯示難度
  - 錯誤次數 Badge
  - 查看、編輯、刪除按鈕
- **API Routes**：
  - `POST /api/questions`：新增錯題
  - `GET /api/questions`：查詢錯題列表
  - `GET /api/questions/[id]`：查詢錯題詳情
  - `PATCH /api/questions/[id]`：更新錯題
  - `DELETE /api/questions/[id]`：刪除錯題

#### Phase 1C: 資料夾管理系統
- **資料夾 CRUD**：新增、編輯、刪除功能
- **樹狀顯示**：FolderTree 元件，支援展開/收合
- **4 層限制**：前端和後端雙重驗證
- **CASCADE 刪除**：刪除父資料夾時自動刪除所有子資料夾
- **Tab 切換式內容顯示**：
  - **子資料夾 Tab**：卡片網格顯示下一層資料夾
  - **錯題本人 Tab**：本資料夾的錯題（不含子資料夾）
  - **全部錯題 Tab**：本資料夾及所有子資料夾的錯題
- **Dashboard UX 優化**：
  - 功能卡片（錯題登錄、智能複習）
  - 統計卡片（總錯題、已複習、本周新增、資料夾數）
  - 快速開始指南

### 🔧 修復
- 修復 @radix-ui/react-icons 依賴問題
- 修復 RPC 函數參數處理
- 修復 NULL 值 SQL 查詢
- 修復子資料夾創建時 parent_id 傳遞
- 修復 HTML 嵌套錯誤（button 內不能有 button）
- 修復 has_subfolders 參數名稱

### 📝 資料庫
- Migration 002：建立 questions 表和 question_folders 關聯表

---

## [0.1.0-dev] - 2025-10-03/04

### ✨ 新增功能

#### Phase 1B: 認證系統
- **登入頁面**：Email + 密碼登入
- **註冊頁面**：Email + 密碼註冊
- **Email 驗證**：支援 PKCE、Token Hash、Token 三種驗證方式
- **錯誤處理頁面**：統一的錯誤頁面顯示
- **驗證等待頁面**：提示用戶查看 Email
- **Dashboard 頁面**：受保護的主控台頁面
- **登出功能**：LogoutButton 元件
- **Middleware 路由守衛**：
  - 保護 /dashboard 路由（需登入）
  - 已登入用戶訪問 /auth/* 自動跳轉到 Dashboard
  - 詳細的請求日誌

#### Phase 1A: 基礎架構
- **Next.js 15.5.4**：專案初始化
- **TypeScript 5.0**：型別安全
- **Tailwind CSS**：樣式系統
- **shadcn/ui**：UI 元件庫
  - Button, Card, Input, Form, Label, Dialog, Tabs
- **Supabase 整合**：
  - 客戶端配置（client.ts, server.ts）
  - Middleware 配置（middleware.ts）
  - 型別定義（database.types.ts）
- **常數定義**：
  - MAX_FOLDER_LEVEL = 4

### 📝 資料庫
- Migration 001：建立 folders 表和 RLS 政策
- 建立 get_folder_tree RPC 函數

### 🎨 設計
- 藍色主題（Blue 500-600）
- 漸層效果（from-blue-500 to-indigo-600）
- 響應式布局
- 統一的卡片設計

---

## [未釋出] - 開發中

### 規劃中
- Phase 2A: 智能複習系統（間隔重複演算法）
- Phase 2B: 統計分析（儀表板、圖表）
- Phase 2C: 搜尋與篩選
- Phase 2D: 進階圖片功能（OCR、標註）
- Phase 3: 社群功能（分享、匯出）

### 已知問題
- Console.log 過多（需要清理）
- 型別斷言使用（EditQuestionDialog）
- 圖片清理邏輯未實作（編輯刪除圖片時）
- 部分 TODO 項目未完成

---

## 版本號規則

本專案使用 [Semantic Versioning](https://semver.org/lang/zh-TW/)：

- **MAJOR** (主版本)：不相容的 API 變更
- **MINOR** (次版本)：向下相容的新功能
- **PATCH** (修訂版本)：向下相容的 Bug 修復

例如：`v0.3.0-dev`
- `0`：主版本（尚未釋出穩定版）
- `3`：次版本（Phase 1F 完成）
- `0`：修訂版本（無 Bug 修復）
- `-dev`：開發版本標記

---

## 連結

- **Repository**: [WrongCollection](https://github.com/WinnerWang971119/WrongCollection)
- **Issues**: [GitHub Issues](https://github.com/WinnerWang971119/WrongCollection/issues)
- **Documentation**: [docs/](docs/)
- **Author**: WinnerWang971119 (wangdiego1119@gmail.com)

---

最後更新：2025-10-05
