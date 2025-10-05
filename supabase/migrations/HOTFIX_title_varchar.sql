-- ============================================
-- 緊急修復：只更新 get_due_questions 函數的型別
-- 說明：修正 title 欄位型別為 VARCHAR(100)
-- 執行：複製以下 SQL 到 Supabase SQL Editor → Run
-- ============================================

-- 🗑️ 先刪除舊函數（因為回傳型別改變）
DROP FUNCTION IF EXISTS get_due_questions(UUID, INTEGER);

-- ✅ 建立新函數（正確的型別）
CREATE OR REPLACE FUNCTION get_due_questions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(100),  -- ✅ 修正：VARCHAR(100) 而非 TEXT
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

-- ============================================
-- ✅ 執行完成後，立即刷新瀏覽器測試！
-- ============================================
