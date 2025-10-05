-- ============================================
-- HOTFIX: 修復刪除資料夾後錯題仍出現在複習佇列
-- 問題：刪除資料夾後，錯題失去所有資料夾關聯，但仍出現在複習佇列
-- 解決：修改 get_due_questions RPC 函數，只返回至少屬於一個資料夾的錯題
-- 日期：2025-10-06
-- ============================================

-- 1. 刪除舊函數
DROP FUNCTION IF EXISTS get_due_questions(UUID, INTEGER);

-- 2. 重新建立函數，新增資料夾檢查
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
    -- 新題目不算逾期
    CASE 
      WHEN q.review_state = 'new' AND q.next_review_date IS NULL THEN FALSE
      WHEN q.next_review_date IS NOT NULL AND q.next_review_date < NOW() THEN TRUE
      ELSE FALSE
    END AS is_overdue,
    -- 新題目的逾期天數為 0
    CASE 
      WHEN q.review_state = 'new' AND q.next_review_date IS NULL THEN 0
      WHEN q.next_review_date IS NOT NULL AND q.next_review_date < NOW() 
      THEN EXTRACT(DAY FROM NOW() - q.next_review_date)::INTEGER
      ELSE 0
    END AS days_overdue
  FROM questions q
  WHERE 
    q.user_id = p_user_id
    -- ✅ 新增：只返回至少屬於一個資料夾的錯題
    AND EXISTS (
      SELECT 1 
      FROM question_folders qf
      INNER JOIN folders f ON qf.folder_id = f.id
      WHERE qf.question_id = q.id
        AND f.user_id = p_user_id
    )
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

COMMENT ON FUNCTION get_due_questions(UUID, INTEGER) IS '取得今日待複習題目（只返回至少屬於一個資料夾的錯題）';

-- ============================================
-- 測試腳本
-- ============================================

-- 測試 1: 查看所有錯題及其資料夾數量
-- SELECT 
--   q.id,
--   q.title,
--   q.review_state,
--   COUNT(qf.folder_id) as folder_count
-- FROM questions q
-- LEFT JOIN question_folders qf ON q.question_id = qf.question_id
-- WHERE q.user_id = auth.uid()
-- GROUP BY q.id, q.title, q.review_state;

-- 測試 2: 查看孤兒錯題（不屬於任何資料夾）
-- SELECT 
--   q.id,
--   q.title,
--   q.review_state,
--   q.created_at
-- FROM questions q
-- WHERE q.user_id = auth.uid()
--   AND NOT EXISTS (
--     SELECT 1 
--     FROM question_folders qf
--     WHERE qf.question_id = q.id
--   );

-- 測試 3: 呼叫修復後的函數
-- SELECT * FROM get_due_questions(auth.uid(), 50);

-- ============================================
-- 預期結果
-- ============================================
-- 1. 刪除資料夾後，該資料夾的錯題如果沒有其他資料夾，將不會出現在複習佇列
-- 2. 如果錯題屬於多個資料夾，刪除其中一個資料夾後，錯題仍會出現
-- 3. 使用者只能看到屬於自己資料夾的錯題
