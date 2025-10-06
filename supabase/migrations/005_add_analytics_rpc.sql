-- ============================================
-- Migration 005: Analytics RPC Functions
-- 說明：新增進階統計分析所需的 RPC 函數
-- 日期：2025-10-06
-- ============================================

-- ============================================
-- 1. get_question_distribution - 錯題分布分析
-- ============================================
CREATE OR REPLACE FUNCTION get_question_distribution(
  p_user_id UUID,
  p_group_by TEXT DEFAULT 'folder' -- 'folder', 'difficulty', 'time'
)
RETURNS TABLE (
  category TEXT,
  count BIGINT,
  percentage FLOAT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_count INTEGER;
BEGIN
  -- 計算總錯題數
  SELECT COUNT(*)::INTEGER INTO v_total_count
  FROM questions
  WHERE user_id = p_user_id;
  
  -- 如果沒有錯題，返回空結果
  IF v_total_count = 0 THEN
    RETURN;
  END IF;
  
  -- 根據分組類型返回不同結果
  IF p_group_by = 'folder' THEN
    -- 按資料夾分組
    RETURN QUERY
    SELECT 
      COALESCE(f.name, '未分類') AS category,
      COUNT(DISTINCT q.id) AS count,
      ROUND((COUNT(DISTINCT q.id)::FLOAT / v_total_count * 100)::NUMERIC, 2)::FLOAT AS percentage
    FROM questions q
    LEFT JOIN question_folders qf ON q.id = qf.question_id
    LEFT JOIN folders f ON qf.folder_id = f.id
    WHERE q.user_id = p_user_id
    GROUP BY f.name
    ORDER BY count DESC;
    
  ELSIF p_group_by = 'difficulty' THEN
    -- 按難度分組
    RETURN QUERY
    SELECT 
      CASE q.difficulty
        WHEN 'easy' THEN '簡單'
        WHEN 'medium' THEN '中等'
        WHEN 'hard' THEN '困難'
        ELSE '未知'
      END AS category,
      COUNT(*)::BIGINT AS count,
      ROUND((COUNT(*)::FLOAT / v_total_count * 100)::NUMERIC, 2)::FLOAT AS percentage
    FROM questions q
    WHERE q.user_id = p_user_id
    GROUP BY q.difficulty
    ORDER BY 
      CASE q.difficulty
        WHEN 'easy' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'hard' THEN 3
        ELSE 4
      END;
      
  ELSIF p_group_by = 'time' THEN
    -- 按時間分組（本周/本月/更早）
    RETURN QUERY
    SELECT 
      CASE 
        WHEN q.created_at >= NOW() - INTERVAL '7 days' THEN '本周'
        WHEN q.created_at >= NOW() - INTERVAL '30 days' THEN '本月'
        ELSE '更早'
      END AS category,
      COUNT(*)::BIGINT AS count,
      ROUND((COUNT(*)::FLOAT / v_total_count * 100)::NUMERIC, 2)::FLOAT AS percentage
    FROM questions q
    WHERE q.user_id = p_user_id
    GROUP BY 
      CASE 
        WHEN q.created_at >= NOW() - INTERVAL '7 days' THEN '本周'
        WHEN q.created_at >= NOW() - INTERVAL '30 days' THEN '本月'
        ELSE '更早'
      END
    ORDER BY 
      CASE 
        WHEN category = '本周' THEN 1
        WHEN category = '本月' THEN 2
        ELSE 3
      END;
  END IF;
END;
$$;

-- ============================================
-- 2. get_learning_progress - 學習進度追蹤
-- ============================================
CREATE OR REPLACE FUNCTION get_learning_progress(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  new_count INTEGER,
  learning_count INTEGER,
  review_count INTEGER,
  mastered_count INTEGER,
  total_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    -- 生成日期序列
    SELECT 
      generate_series(
        CURRENT_DATE - (p_days - 1),
        CURRENT_DATE,
        '1 day'::interval
      )::DATE AS date
  ),
  daily_states AS (
    -- 計算每天各狀態的錯題數
    SELECT 
      ds.date,
      COUNT(*) FILTER (WHERE q.review_state = 'new') AS new_count,
      COUNT(*) FILTER (WHERE q.review_state = 'learning') AS learning_count,
      COUNT(*) FILTER (WHERE q.review_state = 'review') AS review_count,
      COUNT(*) FILTER (WHERE q.review_state = 'mastered') AS mastered_count,
      COUNT(*) AS total_count
    FROM date_series ds
    LEFT JOIN questions q ON 
      q.user_id = p_user_id AND
      q.created_at::DATE <= ds.date
    GROUP BY ds.date
  )
  SELECT 
    date,
    new_count::INTEGER,
    learning_count::INTEGER,
    review_count::INTEGER,
    mastered_count::INTEGER,
    total_count::INTEGER
  FROM daily_states
  ORDER BY date ASC;
END;
$$;

-- ============================================
-- 3. get_easiness_trend - 記憶強度趨勢
-- ============================================
CREATE OR REPLACE FUNCTION get_easiness_trend(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  average_ef FLOAT,
  min_ef FLOAT,
  max_ef FLOAT,
  question_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT 
      generate_series(
        CURRENT_DATE - (p_days - 1),
        CURRENT_DATE,
        '1 day'::interval
      )::DATE AS date
  ),
  daily_ef AS (
    SELECT 
      ds.date,
      AVG(q.easiness_factor) AS avg_ef,
      MIN(q.easiness_factor) AS min_ef,
      MAX(q.easiness_factor) AS max_ef,
      COUNT(*) FILTER (WHERE q.easiness_factor IS NOT NULL) AS question_count
    FROM date_series ds
    LEFT JOIN questions q ON 
      q.user_id = p_user_id AND
      q.created_at::DATE <= ds.date AND
      q.easiness_factor IS NOT NULL
    GROUP BY ds.date
  )
  SELECT 
    date,
    ROUND(COALESCE(avg_ef, 2.5)::NUMERIC, 2)::FLOAT AS average_ef,
    ROUND(COALESCE(min_ef, 2.5)::NUMERIC, 2)::FLOAT AS min_ef,
    ROUND(COALESCE(max_ef, 2.5)::NUMERIC, 2)::FLOAT AS max_ef,
    question_count::INTEGER
  FROM daily_ef
  ORDER BY date ASC;
END;
$$;

-- ============================================
-- 4. get_review_efficiency - 複習效率統計
-- ============================================
CREATE OR REPLACE FUNCTION get_review_efficiency(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_reviews BIGINT,
  correct_reviews BIGINT,
  accuracy_rate FLOAT,
  average_quality FLOAT,
  total_questions BIGINT,
  mastered_questions BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- 總複習次數
    SUM(q.total_reviews)::BIGINT AS total_reviews,
    -- 正確複習次數
    SUM(q.correct_reviews)::BIGINT AS correct_reviews,
    -- 正確率
    CASE 
      WHEN SUM(q.total_reviews) > 0 THEN
        ROUND((SUM(q.correct_reviews)::FLOAT / SUM(q.total_reviews) * 100)::NUMERIC, 2)::FLOAT
      ELSE 0
    END AS accuracy_rate,
    -- 平均質量
    ROUND(COALESCE(AVG(q.average_quality), 0)::NUMERIC, 2)::FLOAT AS average_quality,
    -- 總錯題數
    COUNT(*)::BIGINT AS total_questions,
    -- 已精通題數
    COUNT(*) FILTER (WHERE q.review_state = 'mastered')::BIGINT AS mastered_questions
  FROM questions q
  WHERE 
    q.user_id = p_user_id AND
    q.last_reviewed_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$;

-- ============================================
-- 5. 新增註釋
-- ============================================
COMMENT ON FUNCTION get_question_distribution IS '取得錯題分布（按資料夾/難度/時間）';
COMMENT ON FUNCTION get_learning_progress IS '取得學習進度（每日各狀態錯題數）';
COMMENT ON FUNCTION get_easiness_trend IS '取得記憶強度趨勢（EF 變化）';
COMMENT ON FUNCTION get_review_efficiency IS '取得複習效率統計（正確率、平均質量等）';

-- ============================================
-- Migration 完成
-- ============================================
-- 請在 Supabase SQL Editor 執行此 SQL
-- 然後測試每個函數：
--   SELECT * FROM get_question_distribution('your_user_id', 'folder');
--   SELECT * FROM get_learning_progress('your_user_id', 30);
--   SELECT * FROM get_easiness_trend('your_user_id', 30);
--   SELECT * FROM get_review_efficiency('your_user_id', 30);
-- ============================================
