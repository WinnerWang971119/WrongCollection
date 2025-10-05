-- ============================================
-- 快速驗證腳本：檢查 Migration 003 是否已執行
-- ============================================

-- 1. 檢查 questions 表的欄位
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name IN ('question_image_url', 'question_images', 'explanation_images')
ORDER BY column_name;

-- 預期結果（如果 Migration 003 已執行）:
-- column_name          | data_type | is_nullable | column_default
-- ---------------------|-----------|-------------|----------------
-- explanation_images   | ARRAY     | NO          | '{}'::text[]
-- question_images      | ARRAY     | NO          | '{}'::text[]
-- 
-- 注意：應該「沒有」question_image_url 欄位

-- 如果看到 question_image_url，表示 Migration 003 還沒執行！

-- ============================================

-- 2. 檢查 image_cleanup_queue 表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'image_cleanup_queue'
) AS table_exists;

-- 預期結果: table_exists = true

-- ============================================

-- 3. 檢查觸發器是否存在
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_queue_images_cleanup';

-- 預期結果: 應該有一筆記錄

-- ============================================

-- 4. 檢查函數是否存在
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('get_question_all_images', 'queue_images_for_cleanup');

-- 預期結果: 應該有兩筆記錄

-- ============================================
-- 如果以上檢查都通過，Migration 003 已正確執行
-- 如果有任何項目失敗，請執行完整的 Migration 003 SQL
-- ============================================
