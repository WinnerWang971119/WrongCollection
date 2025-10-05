-- ============================================
-- Migration 004 清理與重置腳本
-- 說明：刪除已存在的物件，準備重新執行完整的 Migration 004
-- 日期：2025-10-05
-- 注意：此腳本會刪除所有 SM-2 相關欄位和函數，請謹慎使用！
-- ============================================

-- 1. 刪除觸發器
DROP TRIGGER IF EXISTS trigger_update_average_quality ON questions;

-- 2. 刪除 RPC 函數
DROP FUNCTION IF EXISTS get_due_questions(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_review_stats(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_review_streak(UUID);
DROP FUNCTION IF EXISTS update_average_quality();

-- 3. 刪除索引
DROP INDEX IF EXISTS idx_questions_next_review_date;
DROP INDEX IF EXISTS idx_questions_review_state;
DROP INDEX IF EXISTS idx_questions_user_review;

-- 4. 刪除欄位（如果存在）
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

-- ============================================
-- 清理完成！現在可以執行完整的 Migration 004
-- ============================================
