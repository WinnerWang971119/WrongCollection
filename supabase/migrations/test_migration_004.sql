-- ============================================
-- 測試腳本：檢查 Migration 004 是否已執行
-- ============================================

-- 1. 檢查 questions 表的欄位
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions'
  AND column_name IN (
    'easiness_factor',
    'repetitions',
    'interval',
    'review_state',
    'next_review_date',
    'last_quality',
    'total_reviews',
    'correct_reviews',
    'average_quality',
    'first_reviewed_at',
    'graduated_at'
  )
ORDER BY column_name;

-- 2. 檢查 RPC 函數是否存在
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'get_due_questions',
  'get_review_stats',
  'get_review_streak'
)
ORDER BY routine_name;

-- 3. 檢查索引是否存在
SELECT indexname
FROM pg_indexes
WHERE tablename = 'questions'
  AND indexname IN (
    'idx_questions_next_review_date',
    'idx_questions_review_state',
    'idx_questions_user_review'
  )
ORDER BY indexname;

-- 4. 檢查觸發器是否存在
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'questions'
  AND trigger_name = 'trigger_update_average_quality';
