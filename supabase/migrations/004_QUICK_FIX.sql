-- ============================================
-- Migration 004: 快速修復腳本
-- 說明：清理 + 重新執行 Migration 004（一鍵執行）
-- 日期：2025-10-05
-- 使用：複製所有內容到 Supabase SQL Editor → 執行
-- ============================================

-- 🧹 第 1 步：清理現有物件
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

-- ✅ 清理完成

-- 📦 第 2 步：新增 SM-2 演算法欄位
ALTER TABLE questions
  ADD COLUMN easiness_factor FLOAT DEFAULT 2.5 CHECK (easiness_factor >= 1.3),
  ADD COLUMN repetitions INTEGER DEFAULT 0 CHECK (repetitions >= 0),
  ADD COLUMN interval INTEGER DEFAULT 1 CHECK (interval >= 0),
  ADD COLUMN review_state TEXT DEFAULT 'new' CHECK (review_state IN ('new', 'learning', 'review', 'mastered')),
  ADD COLUMN next_review_date TIMESTAMPTZ,
  ADD COLUMN last_quality INTEGER CHECK (last_quality >= 1 AND last_quality <= 4),
  ADD COLUMN total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  ADD COLUMN correct_reviews INTEGER DEFAULT 0 CHECK (correct_reviews >= 0),
  ADD COLUMN average_quality FLOAT DEFAULT 0 CHECK (average_quality >= 0 AND average_quality <= 4),
  ADD COLUMN first_reviewed_at TIMESTAMPTZ,
  ADD COLUMN graduated_at TIMESTAMPTZ;

-- 🔍 第 3 步：新增索引
CREATE INDEX idx_questions_next_review_date ON questions(next_review_date) WHERE next_review_date IS NOT NULL;
CREATE INDEX idx_questions_review_state ON questions(review_state);
CREATE INDEX idx_questions_user_review ON questions(user_id, next_review_date, review_state);

-- 📝 第 4 步：新增註釋
COMMENT ON COLUMN questions.easiness_factor IS 'SM-2 難度係數，範圍 1.3-2.5+，越高表示越簡單';
COMMENT ON COLUMN questions.repetitions IS 'SM-2 連續答對次數，答錯時歸零';
COMMENT ON COLUMN questions.interval IS 'SM-2 間隔天數，決定下次複習時間';
COMMENT ON COLUMN questions.review_state IS '複習狀態：new(新)/learning(學習中)/review(複習中)/mastered(已精通)';
COMMENT ON COLUMN questions.next_review_date IS '下次複習時間，用於查詢今日待複習題目';
COMMENT ON COLUMN questions.last_quality IS '上次複習品質：1(Again)/2(Hard)/3(Good)/4(Easy)';

-- 🔧 第 5 步：建立 RPC 函數 - 取得待複習題目
-- 先刪除舊函數（因為回傳型別改變）
DROP FUNCTION IF EXISTS get_due_questions(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_due_questions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(100),  -- 與 questions 表的型別一致
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
    q.id, q.title, q.difficulty, q.wrong_count,
    q.review_state, q.next_review_date, q.last_quality, q.repetitions,
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
  WHERE q.user_id = p_user_id
    AND (
      -- 新題目（從未複習）
      (q.review_state = 'new' AND (q.next_review_date IS NULL OR q.next_review_date <= NOW()))
      -- 或到期的題目
      OR (q.review_state != 'new' AND q.next_review_date IS NOT NULL AND q.next_review_date <= NOW())
    )
  ORDER BY
    CASE 
      WHEN q.review_state != 'new' AND q.next_review_date < NOW() THEN 0
      ELSE 1 
    END,
    q.next_review_date ASC NULLS FIRST,
    CASE q.difficulty WHEN 'hard' THEN 1 WHEN 'medium' THEN 2 WHEN 'easy' THEN 3 END
  LIMIT p_limit;
END;
$$;

-- 📊 第 6 步：建立 RPC 函數 - 取得複習統計
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
  WHERE user_id = p_user_id
    AND last_reviewed_at >= NOW() - (p_days || ' days')::INTERVAL
    AND last_reviewed_at IS NOT NULL
  GROUP BY DATE(last_reviewed_at)
  ORDER BY date DESC;
END;
$$;

-- 🔥 第 7 步：建立 RPC 函數 - 取得連續複習天數
CREATE OR REPLACE FUNCTION get_review_streak(p_user_id UUID)
RETURNS TABLE (current_streak INTEGER, longest_streak INTEGER) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_temp_streak INTEGER := 0;
  v_last_date DATE;
  v_current_date DATE;
BEGIN
  FOR v_current_date IN 
    SELECT DISTINCT DATE(last_reviewed_at) FROM questions
    WHERE user_id = p_user_id AND last_reviewed_at IS NOT NULL
    ORDER BY DATE(last_reviewed_at) DESC
  LOOP
    IF v_last_date IS NULL THEN
      v_temp_streak := 1; v_last_date := v_current_date;
    ELSIF v_current_date = v_last_date - INTERVAL '1 day' THEN
      v_temp_streak := v_temp_streak + 1; v_last_date := v_current_date;
    ELSE EXIT;
    END IF;
  END LOOP;
  
  IF v_last_date = CURRENT_DATE OR v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    v_current_streak := v_temp_streak;
  END IF;
  
  v_temp_streak := 0; v_last_date := NULL;
  FOR v_current_date IN 
    SELECT DISTINCT DATE(last_reviewed_at) FROM questions
    WHERE user_id = p_user_id AND last_reviewed_at IS NOT NULL
    ORDER BY DATE(last_reviewed_at) DESC
  LOOP
    IF v_last_date IS NULL THEN
      v_temp_streak := 1; v_last_date := v_current_date;
    ELSIF v_current_date = v_last_date - INTERVAL '1 day' THEN
      v_temp_streak := v_temp_streak + 1; v_last_date := v_current_date;
      v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);
    ELSE
      v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);
      v_temp_streak := 1; v_last_date := v_current_date;
    END IF;
  END LOOP;
  v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);
  RETURN QUERY SELECT v_current_streak, v_longest_streak;
END;
$$;

-- 📅 第 8 步：初始化現有錯題
-- ⚠️ 注意：只初始化已複習過的題目（review_state != 'new'）
-- 新題目的 next_review_date 保持 NULL，直到第一次複習
UPDATE questions 
SET next_review_date = NOW() 
WHERE next_review_date IS NULL 
  AND review_state != 'new';

-- ⚙️ 第 9 步：建立自動更新觸發器
CREATE OR REPLACE FUNCTION update_average_quality()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_reviews > 0 THEN
    NEW.average_quality := ((OLD.average_quality * OLD.total_reviews) + NEW.last_quality) / NEW.total_reviews;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_average_quality
  BEFORE UPDATE ON questions
  FOR EACH ROW
  WHEN (NEW.last_quality IS NOT NULL AND OLD.last_quality IS DISTINCT FROM NEW.last_quality)
  EXECUTE FUNCTION update_average_quality();

-- ============================================
-- ✅ Migration 004 完成！
-- 
-- 🔍 驗證步驟：
-- 1. 檢查欄位數量（應該是 11）：
--    SELECT COUNT(*) FROM information_schema.columns 
--    WHERE table_name = 'questions' 
--    AND column_name IN ('easiness_factor', 'repetitions', 'interval', 'review_state', 
--                        'next_review_date', 'last_quality', 'total_reviews', 
--                        'correct_reviews', 'average_quality', 'first_reviewed_at', 'graduated_at');
--
-- 2. 檢查 RPC 函數（應該是 3）：
--    SELECT COUNT(*) FROM information_schema.routines 
--    WHERE routine_name IN ('get_due_questions', 'get_review_stats', 'get_review_streak');
--
-- 3. 測試取得待複習題目（替換 user_id）：
--    SELECT * FROM get_due_questions('your-user-id'::uuid, 10);
-- ============================================
