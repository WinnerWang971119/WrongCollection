# 孤兒錯題問題修復指南

## 📅 問題報告日期
2025-10-06

---

## ❌ 問題描述

### 問題現象
當使用者刪除資料夾後，該資料夾中的錯題仍然會出現在複習佇列中。

### 重現步驟
1. 建立一個資料夾（例如：「數學」）
2. 在該資料夾中新增一道錯題
3. 刪除該資料夾
4. 進入「智能複習」
5. **錯誤行為**：錯題仍然出現在複習佇列中

### 預期行為
刪除資料夾後，如果錯題不再屬於任何資料夾，應該從複習佇列中消失。

---

## 🔍 根本原因分析

### 資料庫結構
```
questions (錯題表)
  ↓
question_folders (多對多關聯表)
  ↓
folders (資料夾表)
```

### 刪除流程
1. 使用者刪除資料夾 → `DELETE FROM folders WHERE id = ?`
2. CASCADE 刪除 → `question_folders` 中相關記錄被自動刪除
3. **問題**：`questions` 表中的錯題仍然存在
4. `get_due_questions` RPC 函數只檢查 `questions` 表，未檢查 `question_folders`

### 孤兒錯題
- **定義**：不屬於任何資料夾的錯題
- **產生原因**：刪除所有包含該錯題的資料夾
- **當前行為**：仍會出現在複習佇列
- **期望行為**：不應出現在複習佇列

---

## ✅ 解決方案

### 修復邏輯
在 `get_due_questions` RPC 函數中新增 EXISTS 子查詢，確保只返回至少屬於一個資料夾的錯題。

### 修復前的 SQL
```sql
SELECT ...
FROM questions q
WHERE 
  q.user_id = p_user_id
  AND (
    -- 複習條件
  )
```

### 修復後的 SQL
```sql
SELECT ...
FROM questions q
WHERE 
  q.user_id = p_user_id
  -- ✅ 新增：只返回至少屬於一個資料夾的錯題
  AND EXISTS (
    SELECT 1 
    FROM question_folders qf
    INNER JOIN folders f ON qf.folder_id = f.id
    WHERE qf.question_id = q.id
      AND f.user_id = p_user_id
  )
  AND (
    -- 複習條件
  )
```

### 邏輯說明
- `EXISTS` 檢查是否存在至少一條記錄
- `question_folders qf` 連接錯題和資料夾
- `INNER JOIN folders f` 確保資料夾未被刪除
- `f.user_id = p_user_id` 確保資料夾屬於當前使用者

---

## 🛠️ 修復檔案

### 1. 主要 Migration 檔案
**檔案**: `supabase/migrations/004_add_sm2_algorithm_fields.sql`

**修改位置**: Line 162-171（`get_due_questions` 函數）

**狀態**: ✅ 已修復

---

### 2. 快速修復腳本
**檔案**: `supabase/migrations/004_QUICK_FIX.sql`

**修改位置**: Line 103-112（`get_due_questions` 函數）

**狀態**: ✅ 已修復

---

### 3. HOTFIX 腳本（推薦執行）
**檔案**: `supabase/migrations/HOTFIX_FINAL_new_overdue.sql`

**修改位置**: Line 53-62（`get_due_questions` 函數）

**狀態**: ✅ 已修復

---

### 4. 獨立修復腳本
**檔案**: `supabase/migrations/HOTFIX_orphan_questions.sql`

**內容**: 完整的 DROP + CREATE 腳本

**狀態**: ✅ 已建立

---

## 📖 執行指南

### 方法 1: 執行 HOTFIX_orphan_questions.sql（推薦）

#### 步驟
1. 開啟 Supabase Dashboard
2. 前往 SQL Editor
3. 建立新查詢
4. 複製貼上 `HOTFIX_orphan_questions.sql` 的完整內容
5. 點擊「Run」執行

#### 預期輸出
```
DROP FUNCTION
CREATE FUNCTION
Success. No rows returned
```

---

### 方法 2: 執行更新後的 HOTFIX_FINAL_new_overdue.sql

#### 步驟
同方法 1，但執行 `HOTFIX_FINAL_new_overdue.sql`

#### 優點
- 同時修復「新題目逾期」和「孤兒錯題」兩個問題
- 一次執行，解決所有已知問題

---

## 🧪 測試步驟

### 測試 1: 基本功能測試

#### 步驟
1. 建立資料夾 A
2. 在資料夾 A 中新增錯題 Q1
3. 進入「智能複習」→ 確認 Q1 出現
4. 刪除資料夾 A
5. 刷新頁面（Ctrl + Shift + R）
6. 進入「智能複習」→ **Q1 應該消失** ✅

#### 預期結果
- 刪除資料夾後，Q1 不再出現在複習佇列

---

### 測試 2: 多資料夾測試

#### 步驟
1. 建立資料夾 A 和 B
2. 新增錯題 Q1，同時加入 A 和 B
3. 進入「智能複習」→ 確認 Q1 出現
4. 刪除資料夾 A
5. 刷新頁面
6. 進入「智能複習」→ **Q1 仍然出現** ✅（因為還在 B）
7. 刪除資料夾 B
8. 刷新頁面
9. 進入「智能複習」→ **Q1 應該消失** ✅

#### 預期結果
- 錯題只有在所有包含它的資料夾都被刪除後，才會從複習佇列消失

---

### 測試 3: 孤兒錯題檢查

#### SQL 查詢
```sql
-- 查看所有孤兒錯題（不屬於任何資料夾）
SELECT 
  q.id,
  q.title,
  q.review_state,
  q.created_at
FROM questions q
WHERE q.user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 
    FROM question_folders qf
    WHERE qf.question_id = q.id
  );
```

#### 預期結果
- 修復前：可能有記錄
- 修復後：這些錯題不會出現在 `get_due_questions()` 的結果中

---

### 測試 4: RPC 函數測試

#### SQL 查詢
```sql
-- 呼叫修復後的函數
SELECT * FROM get_due_questions(auth.uid(), 50);
```

#### 檢查
- 所有返回的錯題都應該至少屬於一個資料夾
- 孤兒錯題不應出現在結果中

---

### 測試 5: 自訂複習測試

#### 步驟
1. 建立資料夾 A，新增錯題 Q1
2. 刪除資料夾 A
3. 開啟「自訂複習」對話框
4. 不選擇任何篩選條件（全部）
5. 查看預覽數量 → **Q1 不應計入**
6. 開始複習 → **Q1 不應出現**

#### 注意
自訂複習 API 目前**沒有**孤兒檢查，需要額外修復！

---

## ⚠️ 發現的額外問題

### 問題：自訂複習 API 未過濾孤兒錯題

#### 檔案
`app/api/questions/custom-review/route.ts`

#### 問題程式碼
```typescript
let query = supabase
  .from('questions')
  .select('*')
  .eq('user_id', user.id);

// 資料夾篩選
if (folder_ids && folder_ids.length > 0) {
  // 只在使用者選擇資料夾時才篩選
}
```

#### 問題
- 只有在使用者**主動選擇資料夾**時才會檢查 `question_folders`
- 如果使用者不選擇資料夾（全部），孤兒錯題仍會出現

#### 解決方案
需要修改 `custom-review` API，始終檢查錯題至少屬於一個資料夾。

---

## 🚀 完整修復清單

### ✅ 已完成
1. [x] 修復 `get_due_questions` RPC 函數（今日佇列）
2. [x] 更新 `004_add_sm2_algorithm_fields.sql`
3. [x] 更新 `004_QUICK_FIX.sql`
4. [x] 更新 `HOTFIX_FINAL_new_overdue.sql`
5. [x] 建立 `HOTFIX_orphan_questions.sql`

### ⏳ 待修復
6. [ ] 修復 `custom-review` API（自訂複習）
7. [ ] 測試所有修復
8. [ ] 更新文件

---

## 📊 影響範圍

### 受影響的功能
1. ✅ **今日複習佇列** - 已修復
2. ⚠️ **自訂複習** - 待修復
3. ✅ **刪除資料夾** - 無需修改（CASCADE 正常運作）

### 不受影響的功能
- 新增錯題
- 編輯錯題
- 查看錯題詳情
- 複習評分
- 統計圖表

---

## 🎯 驗證清單

執行修復後，請確認以下項目：

- [ ] 今日複習佇列不顯示孤兒錯題
- [ ] 刪除資料夾後，錯題立即從佇列消失（刷新後）
- [ ] 多資料夾錯題只在所有資料夾刪除後才消失
- [ ] SQL 查詢孤兒錯題，返回空結果或錯題不在佇列中
- [ ] 自訂複習不顯示孤兒錯題（待修復後測試）

---

## 📝 後續建議

### 1. 考慮自動清理孤兒錯題
**選項 A: Trigger 自動刪除**
```sql
CREATE TRIGGER delete_orphan_questions
AFTER DELETE ON question_folders
FOR EACH ROW
EXECUTE FUNCTION check_and_delete_orphan();
```

**選項 B: 定期清理 Cron Job**
```sql
-- 每天清理孤兒錯題
DELETE FROM questions
WHERE NOT EXISTS (
  SELECT 1 FROM question_folders
  WHERE question_id = questions.id
);
```

### 2. UI 提示
在刪除資料夾時，提示使用者：
> 「此資料夾中的 X 道錯題將被移除。如果錯題不屬於其他資料夾，將不再出現在複習佇列中。」

### 3. 孤兒錯題管理頁面
建立「未分類錯題」頁面，顯示所有孤兒錯題，讓使用者：
- 查看孤兒錯題
- 重新分配到資料夾
- 永久刪除

---

## 🎉 總結

### 修復內容
✅ 修復 `get_due_questions` RPC 函數，過濾孤兒錯題

### 修復檔案
- ✅ `004_add_sm2_algorithm_fields.sql`
- ✅ `004_QUICK_FIX.sql`
- ✅ `HOTFIX_FINAL_new_overdue.sql`
- ✅ `HOTFIX_orphan_questions.sql`（新建）

### 執行方式
選擇以下任一方式：
1. 執行 `HOTFIX_orphan_questions.sql`（獨立修復）
2. 執行更新後的 `HOTFIX_FINAL_new_overdue.sql`（綜合修復）

### 預期效果
刪除資料夾後，孤兒錯題不再出現在今日複習佇列中。

---

**文件版本**: v1.0  
**最後更新**: 2025-10-06  
**作者**: GitHub Copilot AI Agent  
**狀態**: ✅ RPC 修復完成，⏳ API 修復待完成
