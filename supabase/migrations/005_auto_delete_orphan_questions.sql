-- ============================================
-- 自動刪除孤兒錯題 - Database Trigger
-- 功能：刪除資料夾或移除錯題-資料夾關聯時，自動刪除孤兒錯題
-- 日期：2025-10-06
-- ============================================

-- 1. 建立清理孤兒錯題的函數
CREATE OR REPLACE FUNCTION cleanup_orphan_questions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orphan_question_id UUID;
  orphan_count INTEGER := 0;
BEGIN
  -- 記錄操作類型
  RAISE NOTICE '觸發孤兒錯題清理檢查...';

  -- 找出所有孤兒錯題（不屬於任何資料夾）
  FOR orphan_question_id IN
    SELECT q.id
    FROM questions q
    WHERE q.user_id = (
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.user_id
        ELSE NEW.user_id
      END
    )
    AND NOT EXISTS (
      SELECT 1 
      FROM question_folders qf
      WHERE qf.question_id = q.id
    )
  LOOP
    -- 刪除孤兒錯題
    DELETE FROM questions WHERE id = orphan_question_id;
    orphan_count := orphan_count + 1;
    RAISE NOTICE '已刪除孤兒錯題: %', orphan_question_id;
  END LOOP;

  IF orphan_count > 0 THEN
    RAISE NOTICE '✅ 共刪除 % 道孤兒錯題', orphan_count;
  ELSE
    RAISE NOTICE '✅ 沒有孤兒錯題需要清理';
  END IF;

  RETURN NULL; -- AFTER trigger 必須返回 NULL
END;
$$;

COMMENT ON FUNCTION cleanup_orphan_questions() IS '清理不屬於任何資料夾的孤兒錯題';

-- 2. 在 folders 表建立 Trigger（刪除資料夾時）
DROP TRIGGER IF EXISTS trigger_cleanup_orphans_on_folder_delete ON folders;

CREATE TRIGGER trigger_cleanup_orphans_on_folder_delete
AFTER DELETE ON folders
FOR EACH ROW
EXECUTE FUNCTION cleanup_orphan_questions();

COMMENT ON TRIGGER trigger_cleanup_orphans_on_folder_delete ON folders IS '刪除資料夾後自動清理孤兒錯題';

-- 3. 在 question_folders 表建立 Trigger（移除關聯時）
DROP TRIGGER IF EXISTS trigger_cleanup_orphans_on_relation_delete ON question_folders;

CREATE TRIGGER trigger_cleanup_orphans_on_relation_delete
AFTER DELETE ON question_folders
FOR EACH ROW
EXECUTE FUNCTION cleanup_orphan_questions();

COMMENT ON TRIGGER trigger_cleanup_orphans_on_relation_delete ON question_folders IS '移除錯題-資料夾關聯後自動清理孤兒錯題';

-- ============================================
-- 測試 Trigger
-- ============================================

-- 測試 1: 建立測試資料
-- CREATE TEMPORARY TABLE test_folder AS SELECT * FROM folders LIMIT 0;
-- INSERT INTO test_folder (id, user_id, name, parent_id, level) 
-- VALUES (gen_random_uuid(), auth.uid(), 'Test Folder', NULL, 1);

-- 測試 2: 建立錯題
-- INSERT INTO questions (id, user_id, title, ...) VALUES (...);
-- INSERT INTO question_folders (question_id, folder_id) VALUES (...);

-- 測試 3: 刪除資料夾
-- DELETE FROM folders WHERE name = 'Test Folder';

-- 測試 4: 檢查錯題是否被刪除
-- SELECT * FROM questions WHERE title = '測試題目';
-- 預期：找不到記錄

-- ============================================
-- 手動清理現有孤兒錯題（可選）
-- ============================================

-- 查看當前孤兒錯題
SELECT 
  q.id,
  q.title,
  q.review_state,
  q.created_at,
  q.user_id
FROM questions q
WHERE NOT EXISTS (
  SELECT 1 
  FROM question_folders qf
  WHERE qf.question_id = q.id
)
ORDER BY q.created_at DESC;

-- 如果要手動清理所有孤兒錯題，取消下面的註解：
/*
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  WITH orphans AS (
    SELECT q.id
    FROM questions q
    WHERE NOT EXISTS (
      SELECT 1 
      FROM question_folders qf
      WHERE qf.question_id = q.id
    )
  )
  DELETE FROM questions
  WHERE id IN (SELECT id FROM orphans);
  
  GET DIAGNOSTICS orphan_count = ROW_COUNT;
  RAISE NOTICE '已清理 % 道孤兒錯題', orphan_count;
END $$;
*/

-- ============================================
-- 驗證 Trigger 已建立
-- ============================================

-- 查看所有 Trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%orphan%'
ORDER BY event_object_table, trigger_name;

-- 預期輸出：
-- trigger_cleanup_orphans_on_folder_delete    DELETE  folders             AFTER   EXECUTE FUNCTION cleanup_orphan_questions()
-- trigger_cleanup_orphans_on_relation_delete  DELETE  question_folders    AFTER   EXECUTE FUNCTION cleanup_orphan_questions()

-- ============================================
-- 說明
-- ============================================

/*
工作流程：

1. 使用者刪除資料夾 A
   ↓
2. PostgreSQL 執行 CASCADE DELETE
   → question_folders 中的關聯被刪除
   ↓
3. Trigger 觸發
   → cleanup_orphan_questions() 執行
   ↓
4. 函數掃描所有錯題
   → 找出不屬於任何資料夾的錯題
   ↓
5. 刪除孤兒錯題
   → DELETE FROM questions WHERE id = ...
   ↓
6. 完成 ✅

優點：
✅ 自動化，無需手動維護
✅ 即時清理，不會累積孤兒錯題
✅ CASCADE 刪除，連帶刪除 Storage 圖片（需要額外處理）
✅ 適用於所有刪除場景（資料夾、關聯）

注意事項：
⚠️ 刪除是永久性的，無法復原
⚠️ 需要額外處理 Storage 圖片清理
⚠️ 大量刪除時可能影響效能（建議批次刪除）
*/
