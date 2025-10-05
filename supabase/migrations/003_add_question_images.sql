-- ============================================
-- Migration 003: 新增圖片上傳支援
-- 日期: 2025-10-05
-- 說明: 
--   1. 移除舊的 question_image_url 欄位
--   2. 新增 question_images 陣列（題目圖片，最多2張）
--   3. 新增 explanation_images 陣列（詳解圖片，最多2張）
--   4. 使用 Supabase Storage 儲存圖片
-- ============================================

-- ============================================
-- 1. 修改 questions 表結構
-- ============================================

-- 刪除舊的圖片 URL 欄位
ALTER TABLE questions DROP COLUMN IF EXISTS question_image_url;

-- 新增圖片路徑陣列欄位
ALTER TABLE questions 
  ADD COLUMN question_images text[] DEFAULT '{}' NOT NULL,
  ADD COLUMN explanation_images text[] DEFAULT '{}' NOT NULL;

-- 新增欄位註解
COMMENT ON COLUMN questions.question_images IS '題目圖片路徑陣列（最多2張），格式: user_id/question_id_timestamp_index.ext';
COMMENT ON COLUMN questions.explanation_images IS '詳解圖片路徑陣列（最多2張），格式: user_id/question_id_timestamp_exp_index.ext';

-- ============================================
-- 2. 新增圖片數量驗證約束（可選）
-- ============================================

-- 確保題目圖片不超過 2 張
ALTER TABLE questions 
  ADD CONSTRAINT check_question_images_count 
  CHECK (array_length(question_images, 1) IS NULL OR array_length(question_images, 1) <= 2);

-- 確保詳解圖片不超過 2 張
ALTER TABLE questions 
  ADD CONSTRAINT check_explanation_images_count 
  CHECK (array_length(explanation_images, 1) IS NULL OR array_length(explanation_images, 1) <= 2);

-- ============================================
-- 3. 建立輔助函數：取得錯題的所有圖片路徑
-- ============================================

CREATE OR REPLACE FUNCTION get_question_all_images(p_question_id UUID)
RETURNS text[] AS $$
DECLARE
  v_images text[];
BEGIN
  SELECT array_cat(question_images, explanation_images)
  INTO v_images
  FROM questions
  WHERE id = p_question_id;
  
  RETURN COALESCE(v_images, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_question_all_images IS '取得指定錯題的所有圖片路徑（題目+詳解）';

-- ============================================
-- 4. 建立觸發器：刪除錯題時記錄需要清理的圖片
-- ============================================

-- 建立圖片清理記錄表（用於追蹤需要刪除的圖片）
CREATE TABLE IF NOT EXISTS image_cleanup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path text NOT NULL,
  question_id uuid,
  created_at timestamptz DEFAULT NOW()
);

COMMENT ON TABLE image_cleanup_queue IS '圖片清理佇列：記錄需要從 Storage 刪除的圖片路徑';

-- 建立觸發器函數
CREATE OR REPLACE FUNCTION queue_images_for_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- 將所有圖片路徑加入清理佇列
  INSERT INTO image_cleanup_queue (image_path, question_id)
  SELECT unnest(get_question_all_images(OLD.id)), OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立觸發器
DROP TRIGGER IF EXISTS trigger_queue_images_cleanup ON questions;
CREATE TRIGGER trigger_queue_images_cleanup
  BEFORE DELETE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION queue_images_for_cleanup();

COMMENT ON TRIGGER trigger_queue_images_cleanup ON questions IS '刪除錯題前，將圖片路徑加入清理佇列';

-- ============================================
-- 5. 更新 RLS 政策（如果需要）
-- ============================================

-- questions 表的 RLS 政策已經涵蓋新欄位，無需修改
-- 但確保政策已啟用
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- image_cleanup_queue 表的 RLS 政策（僅系統內部使用）
ALTER TABLE image_cleanup_queue ENABLE ROW LEVEL SECURITY;

-- 只有系統可以操作清理佇列（使用 SECURITY DEFINER 函數）
CREATE POLICY "Only system can manage cleanup queue"
ON image_cleanup_queue FOR ALL
USING (false); -- 禁止直接存取

-- ============================================
-- Migration 003 完成
-- ============================================

-- 驗證步驟：
-- 1. 檢查 questions 表是否有新欄位：
--    SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'questions' AND column_name LIKE '%image%';
--
-- 2. 測試新增錯題（帶圖片）：
--    INSERT INTO questions (user_id, title, question_images) VALUES (auth.uid(), 'Test', ARRAY['user123/q456.jpg']);
--
-- 3. 測試輔助函數：
--    SELECT get_question_all_images('your-question-id');
--
-- 4. 測試刪除觸發器：
--    DELETE FROM questions WHERE id = 'test-question-id';
--    SELECT * FROM image_cleanup_queue; -- 應該看到圖片路徑

-- 注意事項：
-- 1. 實際的 Storage 清理需要在後端實作（讀取 image_cleanup_queue 並刪除檔案）
-- 2. 建議定期清理 image_cleanup_queue 中已處理的記錄
-- 3. 圖片路徑格式：{user_id}/{question_id}_{timestamp}_{index}.{ext}
