-- ============================================
-- Migration 005 修復 v2：增強「全部」時間範圍功能
-- 說明：當 p_days 為 NULL 時，從用戶第一題創建日期開始計算
-- 日期：2025-10-06
-- ============================================

-- ============================================
-- 1. 更新 get_learning_progress（支援 NULL = 全部時間）
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
  mastered_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- 設定結束日期為今天
  v_end_date := CURRENT_DATE;
  
  -- 如果 p_days 為 NULL（全部時間），則從第一題創建日期開始
  IF p_days IS NULL THEN
    SELECT MIN(created_at::DATE) INTO v_start_date
    FROM questions
    WHERE user_id = p_user_id;
    
    -- 如果沒有任何題目，返回空結果
    IF v_start_date IS NULL THEN
      RETURN;
    END IF;
  ELSE
    -- 使用指定天數
    v_start_date := v_end_date - (p_days - 1);
  END IF;
  
  RETURN QUERY
  WITH date_series AS (
    SELECT 
      generate_series(
        v_start_date,
        v_end_date,
        '1 day'::interval
      )::DATE AS series_date
  ),
  daily_states AS (
    SELECT 
      ds.series_date,
      COUNT(*) FILTER (WHERE q.review_state = 'new')::INTEGER AS cnt_new,
      COUNT(*) FILTER (WHERE q.review_state = 'learning')::INTEGER AS cnt_learning,
      COUNT(*) FILTER (WHERE q.review_state = 'review')::INTEGER AS cnt_review,
      COUNT(*) FILTER (WHERE q.review_state = 'mastered')::INTEGER AS cnt_mastered
    FROM date_series ds
    LEFT JOIN questions q ON 
      q.user_id = p_user_id AND
      q.created_at::DATE <= ds.series_date
    GROUP BY ds.series_date
  )
  SELECT 
    series_date AS date,
    cnt_new AS new_count,
    cnt_learning AS learning_count,
    cnt_review AS review_count,
    cnt_mastered AS mastered_count
  FROM daily_states
  ORDER BY series_date ASC;
END;
$$;

-- ============================================
-- 2. 更新 get_easiness_trend（支援 NULL = 全部時間）
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
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_end_date := CURRENT_DATE;
  
  IF p_days IS NULL THEN
    SELECT MIN(created_at::DATE) INTO v_start_date
    FROM questions
    WHERE user_id = p_user_id;
    
    IF v_start_date IS NULL THEN
      RETURN;
    END IF;
  ELSE
    v_start_date := v_end_date - (p_days - 1);
  END IF;
  
  RETURN QUERY
  WITH date_series AS (
    SELECT 
      generate_series(
        v_start_date,
        v_end_date,
        '1 day'::interval
      )::DATE AS series_date
  ),
  daily_ef AS (
    SELECT 
      ds.series_date,
      AVG(q.easiness_factor) AS ef_avg,
      MIN(q.easiness_factor) AS ef_min,
      MAX(q.easiness_factor) AS ef_max,
      COUNT(*) FILTER (WHERE q.easiness_factor IS NOT NULL)::INTEGER AS ef_count
    FROM date_series ds
    LEFT JOIN questions q ON 
      q.user_id = p_user_id AND
      q.created_at::DATE <= ds.series_date AND
      q.easiness_factor IS NOT NULL
    GROUP BY ds.series_date
  )
  SELECT 
    series_date AS date,
    ROUND(COALESCE(ef_avg, 2.5)::NUMERIC, 2)::FLOAT AS average_ef,
    ROUND(COALESCE(ef_min, 2.5)::NUMERIC, 2)::FLOAT AS min_ef,
    ROUND(COALESCE(ef_max, 2.5)::NUMERIC, 2)::FLOAT AS max_ef,
    ef_count AS question_count
  FROM daily_ef
  ORDER BY series_date ASC;
END;
$$;

-- ============================================
-- 3. 更新 get_review_efficiency（支援 NULL = 全部時間）
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
DECLARE
  v_cutoff_date TIMESTAMP;
BEGIN
  -- 如果 p_days 為 NULL，設定為很久以前的日期（包含所有資料）
  IF p_days IS NULL THEN
    v_cutoff_date := '1970-01-01'::TIMESTAMP;
  ELSE
    v_cutoff_date := NOW() - (p_days || ' days')::INTERVAL;
  END IF;
  
  RETURN QUERY
  SELECT 
    SUM(q.total_reviews)::BIGINT AS total_reviews,
    SUM(q.correct_reviews)::BIGINT AS correct_reviews,
    CASE 
      WHEN SUM(q.total_reviews) > 0 THEN
        ROUND((SUM(q.correct_reviews)::FLOAT / SUM(q.total_reviews) * 100)::NUMERIC, 2)::FLOAT
      ELSE 0
    END AS accuracy_rate,
    ROUND(COALESCE(AVG(q.average_quality), 0)::NUMERIC, 2)::FLOAT AS average_quality,
    COUNT(*)::BIGINT AS total_questions,
    COUNT(*) FILTER (WHERE q.review_state = 'mastered')::BIGINT AS mastered_questions
  FROM questions q
  WHERE 
    q.user_id = p_user_id AND
    q.last_reviewed_at >= v_cutoff_date;
END;
$$;

-- ============================================
-- 4. 更新註釋
-- ============================================
COMMENT ON FUNCTION get_learning_progress IS '取得學習進度（NULL = 從第一題開始）';
COMMENT ON FUNCTION get_easiness_trend IS '取得記憶強度趨勢（NULL = 從第一題開始）';
COMMENT ON FUNCTION get_review_efficiency IS '取得複習效率統計（NULL = 全部時間）';

-- ============================================
-- Migration v2 完成
-- ============================================
-- 更新內容：
--   1. 所有函數支援 p_days = NULL 表示「全部時間」
--   2. get_learning_progress: 從第一題創建日期開始
--   3. get_easiness_trend: 從第一題創建日期開始
--   4. get_review_efficiency: 包含所有複習記錄
-- ============================================
