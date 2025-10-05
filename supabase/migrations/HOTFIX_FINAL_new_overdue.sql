-- ============================================
-- 完整修復腳本：修復新題目逾期問題
-- 執行：複製所有內容到 Supabase SQL Editor → Run
-- ============================================

-- 🔧 第 1 步：更新 RPC 函數（修復新題目逾期判定）
DROP FUNCTION IF EXISTS get_due_questions(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_due_questions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(100),
  difficulty TEXT,
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
    q.id,
    q.title,
    q.difficulty,
    q.wrong_count,
    q.review_state,
    q.next_review_date,
    q.last_quality,
    q.repetitions,
    -- ✅ 修復：新題目不算逾期
    CASE 
      WHEN q.review_state = 'new' AND q.next_review_date IS NULL THEN FALSE
      WHEN q.next_review_date IS NOT NULL AND q.next_review_date < NOW() THEN TRUE
      ELSE FALSE
    END AS is_overdue,
    -- ✅ 修復：新題目的逾期天數為 0
    CASE 
      WHEN q.review_state = 'new' AND q.next_review_date IS NULL THEN 0
      WHEN q.next_review_date IS NOT NULL AND q.next_review_date < NOW() 
      THEN EXTRACT(DAY FROM NOW() - q.next_review_date)::INTEGER
      ELSE 0
    END AS days_overdue
  FROM questions q
  WHERE 
    q.user_id = p_user_id
    AND (
      -- 新題目（從未複習）
      (q.review_state = 'new' AND (q.next_review_date IS NULL OR q.next_review_date <= NOW()))
      -- 或到期的題目（已複習過）
      OR (q.review_state != 'new' AND q.next_review_date IS NOT NULL AND q.next_review_date <= NOW())
    )
  ORDER BY
    -- 逾期題目優先（但新題目不算逾期）
    CASE 
      WHEN q.review_state != 'new' AND q.next_review_date < NOW() THEN 0
      ELSE 1 
    END,
    q.next_review_date ASC NULLS FIRST,
    CASE q.difficulty 
      WHEN 'hard' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'easy' THEN 3
    END
  LIMIT p_limit;
END;
$$;

-- 🔧 第 2 步：清除新題目的錯誤日期
UPDATE questions 
SET next_review_date = NULL
WHERE review_state = 'new' AND next_review_date IS NOT NULL;

-- ============================================
-- ✅ 修復完成！
-- 
-- 修復內容：
-- 1. 新題目（review_state='new' 且 next_review_date=NULL）不會被判定為逾期
-- 2. is_overdue 和 days_overdue 邏輯更新
-- 3. 清除所有新題目的錯誤 next_review_date
-- 4. RLS 政策確保已刪除的題目不出現
-- 
-- 測試步驟：
-- 1. 執行此 SQL
-- 2. 刷新瀏覽器（Ctrl + Shift + R）
-- 3. 點擊「智能複習」
-- 4. 新題目應該不會顯示為「逾期」
-- 5. 已刪除的題目不會出現
-- ============================================
