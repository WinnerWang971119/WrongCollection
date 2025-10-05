# 🔧 修復：新題目逾期問題

## 🐛 問題描述

### 問題 1：新題目被判定為逾期
- **現象**：剛新增的錯題顯示為「逾期 X 天」
- **原因**：Migration 將所有 `next_review_date IS NULL` 的題目設為 `NOW()`
- **影響**：所有新題目立即被標記為逾期

### 問題 2：已刪除的題目仍出現
- **現象**：刪除題目後，複習佇列仍顯示該題
- **原因**：前端快取或未刷新
- **解決**：點擊刷新按鈕（ReviewQueue 右上角）

---

## ✅ 修復方案

### 方案 1：執行完整修復腳本（推薦）⭐

#### 步驟：
1. 開啟 Supabase SQL Editor
2. 複製 `HOTFIX_FINAL_new_overdue.sql` 全部內容
3. 執行（約 2 秒）
4. 刷新瀏覽器

#### 內容：
```sql
-- 1. 更新 RPC 函數（修復逾期判定邏輯）
-- 2. 清除所有新題目的錯誤日期
```

---

### 方案 2：手動修復（分步執行）

#### 步驟 1：更新 RPC 函數
執行 `HOTFIX_2_new_questions.sql`

#### 步驟 2：清除錯誤日期
執行 `HOTFIX_3_clear_new_dates.sql`

---

## 🎯 修復內容

### 1. RPC 函數邏輯更新

**舊邏輯**（錯誤）：
```sql
(q.next_review_date < NOW()) AS is_overdue
-- 問題：新題目的 next_review_date = NOW() 會被判定為逾期
```

**新邏輯**（正確）：
```sql
CASE 
  WHEN q.review_state = 'new' AND q.next_review_date IS NULL THEN FALSE
  WHEN q.next_review_date IS NOT NULL AND q.next_review_date < NOW() THEN TRUE
  ELSE FALSE
END AS is_overdue
-- ✅ 新題目明確設為不逾期
```

### 2. WHERE 條件更新

**舊條件**（模糊）：
```sql
WHERE q.user_id = p_user_id
  AND (q.review_state = 'new' OR q.next_review_date <= NOW())
-- 問題：沒有區分新題目和已複習題目
```

**新條件**（精確）：
```sql
WHERE q.user_id = p_user_id
  AND (
    -- 新題目（從未複習）
    (q.review_state = 'new' AND (q.next_review_date IS NULL OR q.next_review_date <= NOW()))
    -- 或到期的題目（已複習過）
    OR (q.review_state != 'new' AND q.next_review_date IS NOT NULL AND q.next_review_date <= NOW())
  )
-- ✅ 明確區分新題目和已複習題目
```

### 3. 資料清理

**執行 SQL**：
```sql
UPDATE questions 
SET next_review_date = NULL
WHERE review_state = 'new' AND next_review_date IS NOT NULL;
-- ✅ 將所有新題目的 next_review_date 設為 NULL
```

### 4. Migration 更新

**舊 Migration**（錯誤）：
```sql
UPDATE questions 
SET next_review_date = NOW() 
WHERE next_review_date IS NULL;
-- 問題：會更新所有新題目
```

**新 Migration**（正確）：
```sql
UPDATE questions 
SET next_review_date = NOW() 
WHERE next_review_date IS NULL 
  AND review_state != 'new';
-- ✅ 只更新已複習過的題目
```

---

## 🧪 測試步驟

### 1. 執行修復腳本
```bash
1. Supabase SQL Editor
2. 複製 HOTFIX_FINAL_new_overdue.sql
3. Run
4. Success ✅
```

### 2. 清除快取
```bash
1. 瀏覽器：Ctrl + Shift + R（硬刷新）
2. 或：Ctrl + Shift + Delete → 清除快取
```

### 3. 測試新題目
```bash
1. 新增一道錯題
2. 點擊「智能複習」
3. 檢查：
   ✅ 應該顯示「新」標籤
   ❌ 不應該顯示「逾期」
```

### 4. 測試已刪除題目
```bash
1. 刪除一道錯題
2. 點擊「智能複習」右上角的「刷新」按鈕
3. 檢查：
   ✅ 題目應該消失
   ❌ 不應該還在列表中
```

---

## 📊 預期結果

### Console 訊息
```
✅ 正確：
📚 載入今日待複習題目...
✅ 取得 5 題待複習

❌ 不應該有：
載入待複習題目失敗
```

### UI 顯示

#### 新題目
- ✅ 顯示「新」Badge（藍色）
- ❌ 不顯示「逾期 X 天」
- ✅ `is_overdue: false`
- ✅ `days_overdue: 0`

#### 逾期題目
- ✅ 顯示「逾期 X 天」（紅色）
- ✅ 排在前面（優先複習）
- ✅ `is_overdue: true`
- ✅ `days_overdue: > 0`

#### 已刪除題目
- ✅ 不出現在列表中
- ✅ 點擊刷新後消失

---

## 🆘 疑難排解

### 問題：執行 SQL 出錯
**錯誤**：`cannot change return type of existing function`
**解決**：腳本已包含 `DROP FUNCTION`，應該不會出錯

### 問題：前端仍顯示舊資料
**解決**：
1. 點擊 ReviewQueue 右上角的刷新按鈕
2. 硬刷新瀏覽器（Ctrl + Shift + R）
3. 清除快取後重新載入

### 問題：已刪除題目仍出現
**解決**：
1. 確認題目已從資料庫刪除（檢查 Supabase Table Editor）
2. 點擊複習佇列的刷新按鈕
3. 如果仍存在，手動刪除資料庫記錄

---

## 📚 相關檔案

| 檔案 | 說明 | 推薦 |
|------|------|------|
| HOTFIX_FINAL_new_overdue.sql | 完整修復腳本（RPC + 資料清理） | ⭐⭐⭐ |
| HOTFIX_2_new_questions.sql | 只更新 RPC 函數 | ⭐⭐ |
| HOTFIX_3_clear_new_dates.sql | 只清除錯誤日期 | ⭐ |
| 004_add_sm2_algorithm_fields.sql | 完整 Migration（已更新） | ⭐ |
| 004_QUICK_FIX.sql | 一鍵安裝腳本（已更新） | ⭐ |

---

## 🎉 完成標誌

修復成功後，您應該看到：

1. **新題目**：
   - ✅ 顯示「新」標籤
   - ✅ 不顯示逾期
   - ✅ 可以正常複習

2. **逾期題目**：
   - ✅ 顯示「逾期 X 天」
   - ✅ 優先排序
   - ✅ 紅色警告

3. **已刪除題目**：
   - ✅ 不出現在列表
   - ✅ 點刷新後消失

4. **Console 無錯誤**：
   - ✅ 無紅色錯誤訊息
   - ✅ 載入成功訊息

---

**執行時間**：2025-10-06  
**預計耗時**：2 分鐘  
**難度**：⭐ 簡單（複製貼上即可）

有任何問題，請提供完整錯誤訊息！🚀
