# Phase 2C Bug 修復指南

## 🐛 問題總結

### 1. SQL 函數問題
- ❌ **get_question_distribution**: 欄位名稱不匹配（category vs name, count vs value）
- ❌ **get_learning_progress**: 欄位名稱衝突（date, new_count 等）
- ❌ **get_easiness_trend**: 欄位名稱衝突（date, min_ef 等）

### 2. 前端型別問題
- ❌ **QuestionDistribution 介面**: 使用舊欄位名稱
- ❌ **QuestionDistribution 元件**: 引用錯誤的欄位

---

## ✅ 修復步驟

### Step 1: 執行 SQL 修復腳本

在 **Supabase Dashboard → SQL Editor** 執行：

```sql
-- 檔案：005_fix_analytics_rpc.sql
```

這個腳本會：
1. 刪除舊的有問題的函數
2. 重新建立修正後的函數
3. 更新函數註釋

**關鍵修復**：
- `category` → `name`
- `count` → `value`
- 使用 `series_date` 避免 `date` 衝突
- 使用 `cnt_*` 和 `ef_*` 別名避免欄位名稱衝突

### Step 2: 前端已自動修復

以下檔案已自動更新：

1. **lib/api/statistics.api.ts**
   ```typescript
   // ✅ 修復前
   export interface QuestionDistribution {
     category: string;
     count: number;
     percentage: number;
   }
   
   // ✅ 修復後
   export interface QuestionDistribution {
     name: string;
     value: number;
     percentage: number;
   }
   ```

2. **components/statistics/QuestionDistribution.tsx**
   ```typescript
   // ✅ 修復前
   label={({ category, percentage }) => `${category} ${percentage}%`}
   dataKey="count"
   
   // ✅ 修復後
   label={({ name, percentage }) => `${name} ${percentage}%`}
   dataKey="value"
   nameKey="name"
   ```

---

## 🧪 測試檢查清單

執行 SQL 腳本後，檢查：

### 1. 錯題分布（圓餅圖）
- [ ] 點擊「分布」Tab
- [ ] 切換「資料夾」Tab → 顯示資料夾分布
- [ ] 切換「難度」Tab → 顯示難度分布（簡單/中等/困難）
- [ ] 切換「時間」Tab → 顯示時間分布（本周/本月/更早）
- [ ] Hover 圖表 → Tooltip 顯示正確的名稱和數量
- [ ] 底部 Legend 顯示正確的名稱

### 2. 學習進度（折線圖）
- [ ] 點擊「進度」Tab
- [ ] 顯示 4 條線（新題目/學習中/複習中/已掌握）
- [ ] 切換時間範圍（7/30/90/全部）→ 圖表更新
- [ ] Hover 線條 → Tooltip 顯示日期和各狀態數量
- [ ] 無錯誤訊息

### 3. 記憶強度（面積圖）
- [ ] 點擊「強度」Tab
- [ ] 顯示紫色漸層面積圖
- [ ] 右上角顯示平均 EF
- [ ] Hover → Tooltip 顯示 average/min/max EF
- [ ] 無錯誤訊息

### 4. 複習效率（統計卡片）
- [ ] 點擊「效率」Tab
- [ ] 顯示 4 個卡片（總複習次數/答對率/平均品質/已掌握題目）
- [ ] 數字顯示正確
- [ ] 無錯誤訊息

---

## 🎯 預期結果

執行修復後，應該看到：

1. ✅ Console 無錯誤訊息
2. ✅ 所有圖表正常顯示
3. ✅ 圓餅圖顯示正確的名稱和數量
4. ✅ Tooltip 顯示完整資訊（無 undefined）
5. ✅ Legend 顯示正確的分類名稱
6. ✅ 時間範圍切換正常工作

---

## 📊 技術細節

### SQL 欄位名稱衝突原因

PostgreSQL 在 CTE（Common Table Expression）中，如果內外層有相同名稱的欄位，會產生 **ambiguous** 錯誤。

**問題程式碼**：
```sql
WITH date_series AS (
  SELECT generate_series(...)::DATE AS date  -- ❌ 外層也有 date
),
daily_states AS (
  SELECT 
    ds.date,                                   -- ❌ 衝突
    COUNT(*) ... AS new_count                  -- ❌ 外層也有 new_count
  FROM date_series ds
)
SELECT date, new_count FROM daily_states;      -- ❌ Ambiguous!
```

**解決方案**：
```sql
WITH date_series AS (
  SELECT generate_series(...)::DATE AS series_date  -- ✅ 使用別名
),
daily_states AS (
  SELECT 
    ds.series_date,                          -- ✅ 無衝突
    COUNT(*) ... AS cnt_new                  -- ✅ 使用別名
  FROM date_series ds
)
SELECT 
  series_date AS date,                       -- ✅ 最後才轉換
  cnt_new AS new_count                       -- ✅ 最後才轉換
FROM daily_states;
```

---

## 🔄 如果還有問題

1. **檢查 SQL 執行結果**：
   ```sql
   -- 測試函數
   SELECT * FROM get_question_distribution('your_user_id', 'folder');
   SELECT * FROM get_learning_progress('your_user_id', 30);
   SELECT * FROM get_easiness_trend('your_user_id', 30);
   ```

2. **檢查 Console**：
   - 打開瀏覽器 DevTools
   - 查看 Network Tab 的 RPC 請求
   - 查看 Response 資料格式

3. **清除快取**：
   - 重新整理頁面（Ctrl+F5）
   - 清除瀏覽器快取
   - 重啟開發伺服器

---

**修復完成時間**: 2025-10-06  
**影響檔案**: 3 個 SQL 函數 + 2 個前端檔案  
**測試狀態**: ⏳ 待使用者測試
