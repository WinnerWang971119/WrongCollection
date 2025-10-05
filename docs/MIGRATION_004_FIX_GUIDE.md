# Migration 004 執行指南

## 🚨 問題診斷

您遇到的錯誤：
1. ✅ **欄位已存在**：`column "easiness_factor" already exists` - 已修復（使用條件式新增）
2. ✅ **型別不存在**：`type difficulty_enum does not exist` - 已修復（改用 TEXT）

## ✅ 最終解決方案（最簡單）

### 方案 A：完整重置（推薦）⭐

**步驟 1：清理現有物件**
1. 前往 Supabase Dashboard → SQL Editor
2. 複製並執行以下 SQL：

```sql
-- 清理腳本（來自 004_cleanup_and_reset.sql）
DROP TRIGGER IF EXISTS trigger_update_average_quality ON questions;
DROP FUNCTION IF EXISTS get_due_questions(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_review_stats(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_review_streak(UUID);
DROP FUNCTION IF EXISTS update_average_quality();
DROP INDEX IF EXISTS idx_questions_next_review_date;
DROP INDEX IF EXISTS idx_questions_review_state;
DROP INDEX IF EXISTS idx_questions_user_review;
ALTER TABLE questions 
  DROP COLUMN IF EXISTS easiness_factor,
  DROP COLUMN IF EXISTS repetitions,
  DROP COLUMN IF EXISTS interval,
  DROP COLUMN IF EXISTS review_state,
  DROP COLUMN IF EXISTS next_review_date,
  DROP COLUMN IF EXISTS last_quality,
  DROP COLUMN IF EXISTS total_reviews,
  DROP COLUMN IF EXISTS correct_reviews,
  DROP COLUMN IF EXISTS average_quality,
  DROP COLUMN IF EXISTS first_reviewed_at,
  DROP COLUMN IF EXISTS graduated_at;
```

3. 等待顯示 "Success" ✅

**步驟 2：執行完整 Migration**
1. 開啟檔案：`supabase/migrations/004_add_sm2_algorithm_fields.sql`
2. 複製所有內容（312 行）
3. 在 Supabase SQL Editor 執行
4. 等待顯示 "Success" ✅（約需 5-10 秒）

**步驟 3：驗證安裝**
```sql
-- 檢查欄位（應該回傳 11 筆）
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name IN (
  'easiness_factor', 'repetitions', 'interval', 
  'review_state', 'next_review_date', 'last_quality',
  'total_reviews', 'correct_reviews', 'average_quality',
  'first_reviewed_at', 'graduated_at'
);

-- 檢查 RPC 函數（應該回傳 3 筆）
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('get_due_questions', 'get_review_stats', 'get_review_streak');

-- 測試 RPC 函數（替換為您的 user_id）
-- 到 Authentication → Users 複製您的 UUID
SELECT * FROM get_due_questions('your-user-id-here'::uuid, 10);
```

**步驟 4：測試前端**
1. 刷新瀏覽器（Ctrl + Shift + R）
2. 開啟 DevTools Console（F12）
3. 點擊「智能複習」按鈕
4. 檢查 Console：
   - ✅ 應該看到：`📚 呼叫 get_due_questions RPC: {...}`
   - ✅ 應該看到：`✅ 取得待複習題目: X`
   - ✅ 沒有 500 錯誤

---

### 方案 B：只更新 RPC 函數（快速修復）⚡

如果您不想刪除資料，直接執行這段 SQL：

```sql
CREATE OR REPLACE FUNCTION get_due_questions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(100),  -- ✅ 修正：使用 VARCHAR(100) 型別
  difficulty TEXT,  -- ✅ 修正：使用 TEXT 型別
  wrong_count INTEGER,
  review_state TEXT,
  next_review_date TIMESTAMPTZ,
  last_quality INTEGER,
  repetitions INTEGER,
  is_overdue BOOLEAN,
  days_overdue INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id, q.title, q.difficulty,
    q.wrong_count, q.review_state, q.next_review_date,
    q.last_quality, q.repetitions,
    (q.next_review_date < NOW()) AS is_overdue,
    CASE WHEN q.next_review_date < NOW() 
         THEN EXTRACT(DAY FROM NOW() - q.next_review_date)::INTEGER
         ELSE 0 END AS days_overdue
  FROM questions q
  WHERE q.user_id = p_user_id
    AND (q.review_state = 'new' OR q.next_review_date <= NOW())
  ORDER BY
    CASE WHEN q.next_review_date < NOW() THEN 0 ELSE 1 END,
    q.next_review_date ASC NULLS FIRST,
    CASE q.difficulty WHEN 'hard' THEN 1 WHEN 'medium' THEN 2 WHEN 'easy' THEN 3 END
  LIMIT p_limit;
END;
$$;
```

執行後直接測試前端！

---

## 🎯 修復內容

### 1. 欄位新增改為條件式
**舊版**：
```sql
ALTER TABLE questions ADD COLUMN easiness_factor FLOAT DEFAULT 2.5;
```

**新版**：
```sql
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='easiness_factor') THEN
    ALTER TABLE questions ADD COLUMN easiness_factor FLOAT DEFAULT 2.5
      CHECK (easiness_factor >= 1.3);
  END IF;
END $$;
```

### 2. RPC 函數型別修正
**舊版**：
```sql
difficulty TEXT,  -- ❌ 錯誤：資料庫是 ENUM 型別
...
q.difficulty::TEXT,  -- ❌ 強制轉型
```

**新版**：
```sql
difficulty difficulty_enum,  -- ✅ 使用正確的 ENUM 型別
...
q.difficulty,  -- ✅ 直接回傳
```

### 3. 索引與觸發器改為冪等
```sql
CREATE INDEX IF NOT EXISTS ...
DROP TRIGGER IF EXISTS ...
CREATE TRIGGER ...
```

---

## 📊 預期結果

執行成功後：
- ✅ 11 個新欄位新增到 questions 表
- ✅ 3 個 RPC 函數建立（get_due_questions, get_review_stats, get_review_streak）
- ✅ 3 個索引建立（優化查詢效能）
- ✅ 1 個觸發器建立（自動更新 average_quality）
- ✅ 現有錯題的 next_review_date 設為今天

前端測試：
- ✅ Console 顯示：`📚 呼叫 get_due_questions RPC: {user_id: "...", limit: 50}`
- ✅ Console 顯示：`✅ 取得待複習題目: X`
- ✅ ReviewQueue 顯示題目列表
- ✅ 沒有 500 錯誤

---

## 🆘 如果仍然失敗

檢查錯誤訊息：
- **42883**：函數不存在 → 重新執行 Migration
- **42P01**：表不存在 → 檢查資料庫連線
- **42703**：欄位不存在 → 重新執行 Migration
- **42701**：欄位已存在 → 執行清理腳本

提供完整錯誤訊息給我，我會幫您解決！

---

## 📝 檔案清單

1. **004_add_sm2_algorithm_fields.sql**（已修復）
   - 使用 DO 區塊條件式新增欄位
   - 修正 RPC 函數回傳型別
   - 使用 IF NOT EXISTS 新增索引
   - 使用 DROP IF EXISTS + CREATE 建立觸發器

2. **004_cleanup_and_reset.sql**（新建）
   - 清理所有 SM-2 相關物件
   - 準備重新執行完整 Migration

---

**選擇您的方案：**
- 方案 A：完整重置（推薦，確保乾淨安裝）
- 方案 B：快速修復（只更新 RPC 函數）

執行後回報結果，我會協助您驗證！🚀
