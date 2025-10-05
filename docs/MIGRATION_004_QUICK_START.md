# 🚀 Migration 004 快速執行指南

## 問題總結

您遇到了 3 個錯誤，已全部修復：
1. ✅ `column "easiness_factor" already exists` - 已修復（條件式新增）
2. ✅ `structure of query does not match function result type` - 已修復（型別匹配）
3. ✅ `type difficulty_enum does not exist` - 已修復（改用 TEXT）

---

## 🎯 執行步驟（3 分鐘完成）

### Step 1: 開啟 Supabase SQL Editor
1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案
3. 左側選單點擊 **SQL Editor**
4. 點擊 **New query**

### Step 2: 執行一鍵修復腳本 ⭐
1. 開啟檔案：`supabase/migrations/004_QUICK_FIX.sql`
2. **複製所有內容**（200 行）
3. **貼到 SQL Editor**
4. 點擊 **Run** 按鈕（或按 Ctrl+Enter）
5. 等待約 5-10 秒
6. 看到 **Success** ✅

> 💡 這個腳本會自動：
> - 清理所有舊物件（觸發器、函數、索引、欄位）
> - 新增 11 個 SM-2 演算法欄位
> - 建立 3 個 RPC 函數
> - 建立 3 個索引
> - 建立 1 個自動更新觸發器
> - 初始化現有錯題資料

### Step 3: 驗證安裝（選擇性）

在 SQL Editor 執行以下查詢：

```sql
-- 1️⃣ 檢查欄位（應該回傳 11）
SELECT COUNT(*) AS column_count
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name IN (
  'easiness_factor', 'repetitions', 'interval', 
  'review_state', 'next_review_date', 'last_quality',
  'total_reviews', 'correct_reviews', 'average_quality',
  'first_reviewed_at', 'graduated_at'
);

-- 2️⃣ 檢查 RPC 函數（應該回傳 3）
SELECT COUNT(*) AS function_count
FROM information_schema.routines 
WHERE routine_name IN ('get_due_questions', 'get_review_stats', 'get_review_streak');

-- 3️⃣ 檢查索引（應該回傳 3）
SELECT COUNT(*) AS index_count
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexname IN (
  'idx_questions_next_review_date',
  'idx_questions_review_state', 
  'idx_questions_user_review'
);
```

**預期結果**：
- column_count: **11** ✅
- function_count: **3** ✅
- index_count: **3** ✅

### Step 4: 測試 RPC 函數

取得您的 User ID：
1. Supabase Dashboard → **Authentication** → **Users**
2. 複製您的 **UUID**（長得像：`12345678-1234-1234-1234-123456789abc`）

執行測試：
```sql
-- 替換為您的 User ID
SELECT * FROM get_due_questions('YOUR-USER-ID-HERE'::uuid, 10);
```

**預期結果**：
- 如果有錯題：回傳錯題列表 ✅
- 如果沒錯題：回傳空結果 ✅（正常）
- 如果出錯：檢查 User ID 是否正確

### Step 5: 測試前端 🎉

1. 回到您的應用程式
2. **刷新瀏覽器**（Ctrl + Shift + R）
3. **開啟 DevTools Console**（按 F12）
4. 點擊 **「智能複習」** 按鈕

**檢查 Console 訊息**：
```
✅ 應該看到：
📚 呼叫 get_due_questions RPC: {user_id: "...", limit: 50}
✅ 取得待複習題目: 5

❌ 不應該看到：
Failed to load resource: 500
取得待複習題目失敗
structure of query does not match
```

---

## 🎊 成功標誌

如果您看到以下任一情況，代表成功：

1. **有待複習題目**：
   - ReviewQueue 顯示題目列表
   - 可以進行複習
   - 品質評分按鈕可點擊

2. **沒有待複習題目**：
   - 顯示「今日沒有需要複習的題目」
   - 圖示和文字正常顯示
   - 沒有錯誤訊息

3. **Console 無錯誤**：
   - 沒有紅色錯誤訊息
   - 沒有 500 錯誤
   - 只有藍色/綠色的 log

---

## 🆘 疑難排解

### 問題 1：執行 SQL 時出現錯誤

**錯誤訊息**：`syntax error at or near...`
**解決**：確保複製了完整的 SQL 腳本（200 行），包含開頭和結尾

**錯誤訊息**：`permission denied`
**解決**：確保您是專案的 Owner 或有足夠權限

### 問題 2：前端仍然顯示錯誤

**步驟**：
1. 確認 SQL 執行成功（看到 Success）
2. 清除瀏覽器快取（Ctrl + Shift + Delete）
3. 硬刷新頁面（Ctrl + Shift + R）
4. 重新開啟 DevTools Console
5. 再次點擊「智能複習」

### 問題 3：RPC 測試回傳空結果

這是**正常的**！代表：
- 函數執行成功 ✅
- 但目前沒有符合條件的題目
- 原因：所有題目的 `review_state` 都不是 'new'，且 `next_review_date` 還沒到期

**解決**：新增一道錯題，就會出現在複習佇列中！

---

## 📚 相關檔案

- ✅ **一鍵修復腳本**：`supabase/migrations/004_QUICK_FIX.sql`（推薦）
- ✅ **完整 Migration**：`supabase/migrations/004_add_sm2_algorithm_fields.sql`
- ✅ **清理腳本**：`supabase/migrations/004_cleanup_and_reset.sql`
- ✅ **詳細指南**：`docs/MIGRATION_004_FIX_GUIDE.md`

---

## 🎯 下一步

Migration 004 執行成功後，您可以：

1. **測試複習功能**：
   - 新增錯題
   - 點擊「智能複習」
   - 評分（1-4）
   - 觀察 SM-2 演算法運作

2. **查看統計資料**（Phase 2A-9, 2A-10）：
   - 每日複習趨勢圖
   - 連續複習天數計數器

3. **繼續開發**：
   - Phase 2B: 搜尋與篩選
   - Phase 2C: 匯出功能
   - Phase 2D: OCR 圖片辨識

---

**執行時間**：2025-10-05  
**預計耗時**：3-5 分鐘  
**難度**：⭐ 簡單（複製貼上即可）

有任何問題，請提供完整錯誤訊息！🚀
