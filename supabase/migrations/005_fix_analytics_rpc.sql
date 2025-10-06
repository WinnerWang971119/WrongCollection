-- ============================================
-- Migration 005 修復：修正 Analytics RPC Functions
-- 說明：修復型別不匹配和欄位名稱衝突問題
-- 日期：2025-10-06
-- ============================================

-- 1. 刪除舊函數
DROP FUNCTION IF EXISTS get_question_distribution(UUID, TEXT);
DROP FUNCTION IF EXISTS get_learning_progress(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_easiness_trend(UUID, INTEGER);

-- ============================================
-- 2. 重新建立 get_question_distribution（修復 TEXT 型別）
-- ============================================
CREATE OR REPLACE FUNCTION get_question_distribution(
  p_user_id UUID,
  p_group_by TEXT DEFAULT 'folder'
)
RETURNS TABLE (
  name TEXT,
  value BIGINT,
  percentage FLOAT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_total_count
  FROM questions
  WHERE user_id = p_user_id;
  
  IF v_total_count = 0 THEN
    RETURN;
  END IF;
  
  IF p_group_by = 'folder' THEN
    RETURN QUERY
    SELECT 
      COALESCE(f.name, '未分類')::TEXT AS name,
      COUNT(DISTINCT q.id)::BIGINT AS value,
      ROUND((COUNT(DISTINCT q.id)::FLOAT / v_total_count * 100)::NUMERIC, 2)::FLOAT AS percentage
    FROM questions q
    LEFT JOIN question_folders qf ON q.id = qf.question_id
    LEFT JOIN folders f ON qf.folder_id = f.id
    WHERE q.user_id = p_user_id
    GROUP BY f.name
    ORDER BY value DESC;
    
  ELSIF p_group_by = 'difficulty' THEN
    RETURN QUERY
    SELECT 
      (CASE q.difficulty
        WHEN 'easy' THEN '簡單'
        WHEN 'medium' THEN '中等'
        WHEN 'hard' THEN '困難'
        ELSE '未知'
      END)::TEXT AS name,
      COUNT(*)::BIGINT AS value,
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
    RETURN QUERY
    SELECT 
      (CASE 
        WHEN q.created_at >= NOW() - INTERVAL '7 days' THEN '本周'
        WHEN q.created_at >= NOW() - INTERVAL '30 days' THEN '本月'
        ELSE '更早'
      END)::TEXT AS name,
      COUNT(*)::BIGINT AS value,
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
      CASE name
        WHEN '本周' THEN 1
        WHEN '本月' THEN 2
        ELSE 3
      END;
  END IF;
END;
$$;

-- ============================================
-- 3. 重新建立 get_learning_progress（修復 date 衝突）
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
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT 
      generate_series(
        CURRENT_DATE - (p_days - 1),
        CURRENT_DATE,
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
-- 4. 重新建立 get_easiness_trend（修復 date 衝突）
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
-- 5. 更新註釋
-- ============================================
COMMENT ON FUNCTION get_question_distribution IS '取得錯題分布（按資料夾/難度/時間）- 已修復型別';
COMMENT ON FUNCTION get_learning_progress IS '取得學習進度（每日各狀態錯題數）- 已修復欄位衝突';
COMMENT ON FUNCTION get_easiness_trend IS '取得記憶強度趨勢（EF 變化）- 已修復欄位衝突';

-- ============================================
-- Migration 完成
-- ============================================
-- 請在 Supabase SQL Editor 執行此 SQL
-- 修復內容：
--   1. get_question_distribution: 
--      - category → name，強制轉型為 TEXT
--      - count → value
--   2. get_learning_progress: 
--      - 使用 series_date 避免 date 衝突
--      - 使用 cnt_* 別名避免欄位名稱衝突
--      - 移除 total_count
--   3. get_easiness_trend: 
--      - 使用 series_date 避免 date 衝突
--      - 使用 ef_* 別名避免欄位名稱衝突
-- 
-- 前端修復：
--   1. QuestionDistribution.tsx: category → name, count → value
--   2. statistics.api.ts: QuestionDistribution 介面更新
-- ============================================
