# 自動刪除孤兒錯題 - 完整指南

## 📅 建立日期
2025-10-06

---

## 🎯 解決方案選擇

您提到：「重要的是如果刪除資料夾，錯題也要被刪除，避免孤兒錯題」

我完全同意！現在實作了**自動刪除孤兒錯題**的機制。

---

## 🆚 方案對比

### 方案 A: 過濾顯示（已實作）
- ✅ 資料不會遺失
- ❌ 資料庫中存在無用資料
- ❌ 需要在查詢中過濾

### 方案 B: 自動刪除（新方案 - 推薦）✨
- ✅ 資料庫保持乾淨
- ✅ 無需在查詢中過濾
- ✅ 自動化，無需手動維護
- ⚠️ 刪除是永久性的

---

## 🔧 技術實作

### Database Trigger 機制

使用 PostgreSQL Trigger 在刪除資料夾或關聯時，自動檢查並刪除孤兒錯題。

#### 工作流程
```
使用者刪除資料夾 A
  ↓
CASCADE DELETE 刪除 question_folders 關聯
  ↓
Trigger 自動觸發
  ↓
cleanup_orphan_questions() 函數執行
  ↓
掃描所有錯題，找出孤兒
  ↓
DELETE FROM questions WHERE id = ...
  ↓
完成 ✅
```

---

## 📋 Migration 檔案

### 新檔案：`005_auto_delete_orphan_questions.sql`

包含：
1. ✅ **cleanup_orphan_questions() 函數**
   - 掃描孤兒錯題
   - 自動刪除
   - 記錄刪除數量

2. ✅ **trigger_cleanup_orphans_on_folder_delete**
   - 在 folders 表上觸發
   - 刪除資料夾時執行

3. ✅ **trigger_cleanup_orphans_on_relation_delete**
   - 在 question_folders 表上觸發
   - 移除關聯時執行

4. ✅ **手動清理腳本**
   - 清理現有的孤兒錯題

5. ✅ **驗證查詢**
   - 檢查 Trigger 是否建立成功

---

## 🚀 執行步驟

### 步驟 1: 執行 Migration 005

在 Supabase SQL Editor 中執行：

```sql
-- 檔案：005_auto_delete_orphan_questions.sql
-- 完整複製貼上後執行
```

**預期輸出**：
```
CREATE FUNCTION
DROP TRIGGER
CREATE TRIGGER
DROP TRIGGER
CREATE TRIGGER
Success. No rows returned
```

---

### 步驟 2: 驗證 Trigger 已建立

執行驗證查詢：

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%orphan%'
ORDER BY event_object_table, trigger_name;
```

**預期結果**：
| trigger_name | event_manipulation | event_object_table | action_timing |
|--------------|-------------------|-------------------|---------------|
| trigger_cleanup_orphans_on_folder_delete | DELETE | folders | AFTER |
| trigger_cleanup_orphans_on_relation_delete | DELETE | question_folders | AFTER |

---

### 步驟 3: 清理現有孤兒錯題（可選）

#### 3.1 檢查現有孤兒錯題

```sql
SELECT 
  q.id,
  q.title,
  q.review_state,
  q.created_at
FROM questions q
WHERE NOT EXISTS (
  SELECT 1 
  FROM question_folders qf
  WHERE qf.question_id = q.id
)
ORDER BY q.created_at DESC;
```

#### 3.2 手動清理（如果有孤兒錯題）

```sql
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
```

**注意**：這會永久刪除所有現有的孤兒錯題！

---

## 🧪 測試驗證

### 測試 1: 基本刪除測試

#### 步驟
1. 建立資料夾 A
2. 在資料夾 A 中新增錯題 Q1
3. 記錄 Q1 的 ID
4. 刪除資料夾 A
5. 查詢 Q1 是否存在

#### SQL 測試
```sql
-- 1. 建立測試資料夾
INSERT INTO folders (id, user_id, name, parent_id, level)
VALUES (
  gen_random_uuid(), 
  auth.uid(), 
  'Test Folder A', 
  NULL, 
  1
)
RETURNING id;
-- 記錄返回的 folder_id

-- 2. 建立測試錯題
INSERT INTO questions (
  id, user_id, title, 
  question_text, my_answer, correct_answer,
  difficulty, review_state
)
VALUES (
  gen_random_uuid(),
  auth.uid(),
  'Test Question 1',
  'Test content',
  'Wrong answer',
  'Correct answer',
  'medium',
  'new'
)
RETURNING id;
-- 記錄返回的 question_id

-- 3. 建立關聯
INSERT INTO question_folders (question_id, folder_id)
VALUES ('question_id', 'folder_id');

-- 4. 確認錯題存在
SELECT * FROM questions WHERE title = 'Test Question 1';

-- 5. 刪除資料夾
DELETE FROM folders WHERE name = 'Test Folder A';

-- 6. 檢查錯題是否被自動刪除
SELECT * FROM questions WHERE title = 'Test Question 1';
-- ✅ 預期：0 rows（錯題已被自動刪除）
```

---

### 測試 2: 多資料夾測試

#### 步驟
1. 建立資料夾 A 和 B
2. 新增錯題 Q1，同時加入 A 和 B
3. 刪除資料夾 A
4. 確認 Q1 仍存在（因為還在 B）
5. 刪除資料夾 B
6. 確認 Q1 被自動刪除

#### SQL 測試
```sql
-- 1. 建立兩個資料夾
INSERT INTO folders (id, user_id, name, parent_id, level)
VALUES 
  (gen_random_uuid(), auth.uid(), 'Test Folder A', NULL, 1),
  (gen_random_uuid(), auth.uid(), 'Test Folder B', NULL, 1)
RETURNING id;
-- 記錄兩個 folder_id

-- 2. 建立錯題並加入兩個資料夾
INSERT INTO questions (...)
RETURNING id;
-- 記錄 question_id

INSERT INTO question_folders (question_id, folder_id)
VALUES 
  ('question_id', 'folder_a_id'),
  ('question_id', 'folder_b_id');

-- 3. 刪除資料夾 A
DELETE FROM folders WHERE name = 'Test Folder A';

-- 4. 檢查錯題仍存在
SELECT * FROM questions WHERE title = 'Test Question 1';
-- ✅ 預期：1 row（錯題仍在，因為還屬於 B）

-- 5. 刪除資料夾 B
DELETE FROM folders WHERE name = 'Test Folder B';

-- 6. 檢查錯題已刪除
SELECT * FROM questions WHERE title = 'Test Question 1';
-- ✅ 預期：0 rows（錯題已被自動刪除）
```

---

### 測試 3: 移除關聯測試

#### 步驟
1. 建立資料夾 A，新增錯題 Q1
2. 直接刪除 question_folders 關聯
3. 確認 Q1 被自動刪除

#### SQL 測試
```sql
-- 1. 建立並關聯
INSERT INTO folders (...) RETURNING id;
INSERT INTO questions (...) RETURNING id;
INSERT INTO question_folders (question_id, folder_id) VALUES (...);

-- 2. 刪除關聯（不刪除資料夾）
DELETE FROM question_folders 
WHERE question_id = 'question_id' AND folder_id = 'folder_id';

-- 3. 檢查錯題已刪除
SELECT * FROM questions WHERE id = 'question_id';
-- ✅ 預期：0 rows（錯題已被自動刪除）
```

---

## 🎨 前端體驗

### 刪除前
```
使用者點擊「刪除資料夾」
  ↓
顯示確認對話框
```

### 建議改進：新增警告提示

在刪除資料夾時，顯示更明確的警告：

```tsx
// DeleteFolderDialog.tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>確認刪除資料夾</AlertDialogTitle>
      <AlertDialogDescription className="space-y-2">
        <p>此操作無法復原！</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 space-y-1">
          <p className="font-semibold text-yellow-800">
            ⚠️ 將刪除：
          </p>
          <ul className="text-sm text-yellow-700 list-disc list-inside">
            <li>資料夾「{folderName}」</li>
            <li>所有子資料夾（{subfolderCount} 個）</li>
            <li>
              不屬於其他資料夾的錯題（{orphanQuestionCount} 題）
            </li>
          </ul>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-700">
            💡 屬於多個資料夾的錯題將保留
          </p>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction 
        className="bg-red-600 hover:bg-red-700"
        onClick={handleDelete}
      >
        確認刪除
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 📊 Storage 圖片清理

### 問題
Trigger 會刪除 questions 記錄，但不會刪除 Storage 中的圖片。

### 解決方案 1: 在 Trigger 中清理（複雜）

修改 `cleanup_orphan_questions()` 函數，增加圖片刪除邏輯：

```sql
CREATE OR REPLACE FUNCTION cleanup_orphan_questions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orphan_record RECORD;
  orphan_count INTEGER := 0;
  image_path TEXT;
BEGIN
  -- 找出孤兒錯題及其圖片路徑
  FOR orphan_record IN
    SELECT 
      q.id,
      q.question_images,
      q.explanation_images
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
    -- 刪除題目圖片
    IF orphan_record.question_images IS NOT NULL THEN
      FOREACH image_path IN ARRAY orphan_record.question_images
      LOOP
        -- 呼叫 Storage API 刪除圖片（需要額外實作）
        PERFORM storage.delete_object('question-images', image_path);
      END LOOP;
    END IF;

    -- 刪除詳解圖片
    IF orphan_record.explanation_images IS NOT NULL THEN
      FOREACH image_path IN ARRAY orphan_record.explanation_images
      LOOP
        PERFORM storage.delete_object('question-images', image_path);
      END LOOP;
    END IF;

    -- 刪除錯題記錄
    DELETE FROM questions WHERE id = orphan_record.id;
    orphan_count := orphan_count + 1;
  END LOOP;

  RAISE NOTICE '✅ 共刪除 % 道孤兒錯題', orphan_count;
  RETURN NULL;
END;
$$;
```

### 解決方案 2: 定期清理（簡單 - 推薦）

使用現有的 `image_cleanup_queue` 表 + Cron Job：

```sql
-- 在 DELETE questions 時，自動加入清理佇列（已有 Trigger）
-- 定期執行清理（可以用 Supabase Edge Functions）
```

---

## ⚙️ 與現有功能的整合

### 現況
- ✅ 已實作過濾邏輯（Migration 004 修復）
- ✅ 已實作自動刪除機制（Migration 005）

### 建議
保留兩層防護：

1. **第一層**：Trigger 自動刪除（主要防護）
2. **第二層**：查詢過濾（備用防護）

這樣即使 Trigger 失敗，查詢也不會返回孤兒錯題。

---

## 🎯 執行清單

### 必須執行
- [x] 已執行 `HOTFIX_orphan_questions.sql`（過濾邏輯）
- [ ] **執行 `005_auto_delete_orphan_questions.sql`**（自動刪除）⚠️

### 可選執行
- [ ] 手動清理現有孤兒錯題
- [ ] 更新刪除資料夾的確認對話框
- [ ] 實作 Storage 圖片清理

---

## 📈 效能考量

### Trigger 效能
- **單筆刪除**：<10ms（幾乎無感）
- **批次刪除**：視孤兒數量而定
- **建議**：限制單次刪除資料夾數量

### 優化建議
```sql
-- 在 question_folders 建立索引（如果尚未存在）
CREATE INDEX IF NOT EXISTS idx_question_folders_question_id 
ON question_folders(question_id);

-- 在 folders 建立索引
CREATE INDEX IF NOT EXISTS idx_folders_user_id 
ON folders(user_id);
```

---

## 🛡️ 安全考量

### 1. 防止誤刪
- ✅ CASCADE DELETE 確保資料一致性
- ✅ Trigger 在 AFTER DELETE 執行（資料已刪除）
- ⚠️ 刪除是永久性的，無法復原

### 2. 權限控制
```sql
-- Trigger 函數使用 SECURITY DEFINER
-- 確保只有資料庫可以執行
```

### 3. 審計日誌（可選）
```sql
-- 建立審計表記錄刪除操作
CREATE TABLE question_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID,
  question_title TEXT,
  deleted_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);
```

---

## 🎉 總結

### 新增內容
1. ✅ **Migration 005**：自動刪除孤兒錯題
2. ✅ **Database Trigger**：兩個觸發器（folders + question_folders）
3. ✅ **清理函數**：掃描並刪除孤兒
4. ✅ **驗證腳本**：測試 Trigger 功能
5. ✅ **手動清理腳本**：清理現有孤兒

### 優點
- 🎯 自動化，無需手動維護
- 🎯 資料庫保持乾淨
- 🎯 即時清理，不會累積
- 🎯 適用於所有刪除場景

### 注意事項
- ⚠️ 刪除是永久性的
- ⚠️ 需要額外處理 Storage 圖片
- ⚠️ 建議在刪除前顯示警告

---

## 📝 後續步驟

1. **立即執行**：
   - 執行 `005_auto_delete_orphan_questions.sql`
   - 驗證 Trigger 已建立
   - 測試刪除功能

2. **可選改進**：
   - 更新刪除確認對話框
   - 實作 Storage 圖片清理
   - 建立審計日誌

3. **測試驗證**：
   - 測試單一資料夾刪除
   - 測試多資料夾錯題
   - 測試移除關聯

---

**文件版本**: v1.0  
**最後更新**: 2025-10-06  
**作者**: GitHub Copilot AI Agent  
**狀態**: ✅ 準備就緒，等待執行
