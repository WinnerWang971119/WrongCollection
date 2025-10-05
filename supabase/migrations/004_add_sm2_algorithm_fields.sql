-- ============================================
-- Migration 004: Add SM-2 Algorithm Fields
-- 說明：新增間隔重複演算法（Spaced Repetition）所需欄位
-- 日期：2025-10-05
-- ============================================

-- 1. 新增 SM-2 演算法欄位到 questions 表
-- 使用 DO 區塊來檢查欄位是否存在
DO $$ 
BEGIN
  -- easiness_factor
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='easiness_factor') THEN
    ALTER TABLE questions ADD COLUMN easiness_factor FLOAT DEFAULT 2.5
      CHECK (easiness_factor >= 1.3);
  END IF;

  -- repetitions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='repetitions') THEN
    ALTER TABLE questions ADD COLUMN repetitions INTEGER DEFAULT 0
      CHECK (repetitions >= 0);
  END IF;

  -- interval
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='interval') THEN
    ALTER TABLE questions ADD COLUMN interval INTEGER DEFAULT 1
      CHECK (interval >= 0);
  END IF;

  -- review_state
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='review_state') THEN
    ALTER TABLE questions ADD COLUMN review_state TEXT DEFAULT 'new'
      CHECK (review_state IN ('new', 'learning', 'review', 'mastered'));
  END IF;

  -- next_review_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='next_review_date') THEN
    ALTER TABLE questions ADD COLUMN next_review_date TIMESTAMPTZ;
  END IF;

  -- last_quality
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='last_quality') THEN
    ALTER TABLE questions ADD COLUMN last_quality INTEGER
      CHECK (last_quality >= 1 AND last_quality <= 4);
  END IF;

  -- total_reviews
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='total_reviews') THEN
    ALTER TABLE questions ADD COLUMN total_reviews INTEGER DEFAULT 0
      CHECK (total_reviews >= 0);
  END IF;

  -- correct_reviews
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='correct_reviews') THEN
    ALTER TABLE questions ADD COLUMN correct_reviews INTEGER DEFAULT 0
      CHECK (correct_reviews >= 0);
  END IF;

  -- average_quality
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='average_quality') THEN
    ALTER TABLE questions ADD COLUMN average_quality FLOAT DEFAULT 0
      CHECK (average_quality >= 0 AND average_quality <= 4);
  END IF;

  -- first_reviewed_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='first_reviewed_at') THEN
    ALTER TABLE questions ADD COLUMN first_reviewed_at TIMESTAMPTZ;
  END IF;

  -- graduated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='questions' AND column_name='graduated_at') THEN
    ALTER TABLE questions ADD COLUMN graduated_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. 新增索引以優化查詢效能（如果不存在）
CREATE INDEX IF NOT EXISTS idx_questions_next_review_date 
  ON questions(next_review_date) 
  WHERE next_review_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_questions_review_state 
  ON questions(review_state);

CREATE INDEX IF NOT EXISTS idx_questions_user_review 
  ON questions(user_id, next_review_date, review_state);

-- 3. 新增註釋說明
COMMENT ON COLUMN questions.easiness_factor IS 'SM-2 難度係數，範圍 1.3-2.5+，越高表示越簡單';
COMMENT ON COLUMN questions.repetitions IS 'SM-2 連續答對次數，答錯時歸零';
COMMENT ON COLUMN questions.interval IS 'SM-2 間隔天數，決定下次複習時間';
COMMENT ON COLUMN questions.review_state IS '複習狀態：new(新)/learning(學習中)/review(複習中)/mastered(已精通)';
COMMENT ON COLUMN questions.next_review_date IS '下次複習時間，用於查詢今日待複習題目';
COMMENT ON COLUMN questions.last_quality IS '上次複習品質：1(Again)/2(Hard)/3(Good)/4(Easy)';
COMMENT ON COLUMN questions.total_reviews IS '總複習次數';
COMMENT ON COLUMN questions.correct_reviews IS '正確複習次數（品質>=3）';
COMMENT ON COLUMN questions.average_quality IS '平均複習品質';

-- 4. 新增 RPC 函數：取得今日待複習題目
-- 先刪除舊函數（如果存在），因為回傳型別可能改變
DROP FUNCTION IF EXISTS get_due_questions(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_due_questions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(100),  -- 與 questions 表的型別一致
  difficulty TEXT,  -- 使用 TEXT 型別（與 questions 表一致）
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

-- 5. 新增 RPC 函數：取得複習統計
CREATE OR REPLACE FUNCTION get_review_stats(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  total_reviews INTEGER,
  correct_reviews INTEGER,
  average_quality FLOAT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(last_reviewed_at) AS date,
    COUNT(*)::INTEGER AS total_reviews,
    COUNT(*) FILTER (WHERE last_quality >= 3)::INTEGER AS correct_reviews,
    AVG(last_quality)::FLOAT AS average_quality
  FROM questions
  WHERE 
    user_id = p_user_id
    AND last_reviewed_at >= NOW() - (p_days || ' days')::INTERVAL
    AND last_reviewed_at IS NOT NULL
  GROUP BY DATE(last_reviewed_at)
  ORDER BY date DESC;
END;
$$;

-- 6. 新增 RPC 函數：取得 Day Streak（連續複習天數）
CREATE OR REPLACE FUNCTION get_review_streak(
  p_user_id UUID
)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_temp_streak INTEGER := 0;
  v_last_date DATE;
  v_current_date DATE;
BEGIN
  -- 計算當前連續天數
  FOR v_current_date IN 
    SELECT DISTINCT DATE(last_reviewed_at) 
    FROM questions
    WHERE user_id = p_user_id
      AND last_reviewed_at IS NOT NULL
    ORDER BY DATE(last_reviewed_at) DESC
  LOOP
    IF v_last_date IS NULL THEN
      -- 第一天
      v_temp_streak := 1;
      v_last_date := v_current_date;
    ELSIF v_current_date = v_last_date - INTERVAL '1 day' THEN
      -- 連續天數
      v_temp_streak := v_temp_streak + 1;
      v_last_date := v_current_date;
    ELSE
      -- 中斷
      EXIT;
    END IF;
  END LOOP;
  
  -- 檢查是否包含今天
  IF v_last_date = CURRENT_DATE OR v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    v_current_streak := v_temp_streak;
  ELSE
    v_current_streak := 0;
  END IF;
  
  -- 計算最長連續天數
  v_temp_streak := 0;
  v_last_date := NULL;
  
  FOR v_current_date IN 
    SELECT DISTINCT DATE(last_reviewed_at) 
    FROM questions
    WHERE user_id = p_user_id
      AND last_reviewed_at IS NOT NULL
    ORDER BY DATE(last_reviewed_at) DESC
  LOOP
    IF v_last_date IS NULL THEN
      v_temp_streak := 1;
      v_last_date := v_current_date;
    ELSIF v_current_date = v_last_date - INTERVAL '1 day' THEN
      v_temp_streak := v_temp_streak + 1;
      v_last_date := v_current_date;
      v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);
    ELSE
      v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);
      v_temp_streak := 1;
      v_last_date := v_current_date;
    END IF;
  END LOOP;
  
  v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);
  
  RETURN QUERY SELECT v_current_streak, v_longest_streak;
END;
$$;

-- 7. 更新現有錯題的 next_review_date
-- ⚠️ 注意：只初始化已複習過的題目（review_state != 'new'）
-- 新題目的 next_review_date 保持 NULL，直到第一次複習
UPDATE questions 
SET next_review_date = NOW()
WHERE next_review_date IS NULL
  AND review_state != 'new';

-- 8. 新增觸發器：自動更新 average_quality
CREATE OR REPLACE FUNCTION update_average_quality()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_reviews > 0 THEN
    -- 重新計算平均品質
    -- average_quality = (old_average * old_count + new_quality) / new_count
    NEW.average_quality := 
      ((OLD.average_quality * OLD.total_reviews) + NEW.last_quality) 
      / NEW.total_reviews;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_average_quality ON questions;

CREATE TRIGGER trigger_update_average_quality
  BEFORE UPDATE ON questions
  FOR EACH ROW
  WHEN (NEW.last_quality IS NOT NULL AND OLD.last_quality IS DISTINCT FROM NEW.last_quality)
  EXECUTE FUNCTION update_average_quality();

-- ============================================
-- Migration 完成
-- ============================================
