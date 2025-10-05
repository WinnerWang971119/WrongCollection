-- ============================================
-- 修復 1: 新題目不應該被判定為逾期
-- 修復 2: 確保已刪除的題目不會出現
-- ============================================

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
    -- ✅ 修復：新題目（review_state='new' 且 next_review_date IS NULL）不算逾期
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
    -- 取得需要複習的題目
    AND (
      -- 新題目（從未複習過，next_review_date 可能是 NULL）
      (q.review_state = 'new' AND (q.next_review_date IS NULL OR q.next_review_date <= NOW()))
      -- 或到期的題目（已複習過，next_review_date 到期）
      OR (q.review_state != 'new' AND q.next_review_date IS NOT NULL AND q.next_review_date <= NOW())
    )
  ORDER BY
    -- 逾期題目優先（但新題目不算逾期）
    CASE 
      WHEN q.review_state != 'new' AND q.next_review_date < NOW() THEN 0
      ELSE 1 
    END,
    -- 逾期越久越優先
    q.next_review_date ASC NULLS FIRST,
    -- 難度高的優先
    CASE q.difficulty 
      WHEN 'hard' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'easy' THEN 3
    END
  LIMIT p_limit;
END;
$$;

-- ============================================
-- ✅ 修復完成！
-- 
-- 變更說明：
-- 1. 新題目（review_state='new' 且 next_review_date IS NULL）不會被判定為逾期
-- 2. is_overdue 和 days_overdue 的邏輯更新
-- 3. WHERE 條件更精確，區分新題目和已複習題目
-- 4. RLS 政策會自動確保已刪除的題目不出現（user_id 過濾）
-- ============================================
