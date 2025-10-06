# 🐛 連續天數顯示 0 的除錯指南

## 問題現象
- 昨天有複習（DailyTrendChart 有顯示）
- 但 DayStreakCounter 顯示 0 天連續複習

## 原因分析

### 1. `get_review_streak` 函數的邏輯
```sql
-- 檢查條件：最後複習日期必須是今天或昨天
IF v_last_date = CURRENT_DATE OR v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
  v_current_streak := v_temp_streak;
ELSE
  v_current_streak := 0;  -- ❌ 不符合條件就歸零
END IF;
```

### 2. 資料來源
- `get_review_streak` 讀取：`questions.last_reviewed_at`
- `get_review_stats` 讀取：`review_records` 表（如果存在）或其他來源

### 3. 可能的原因

#### 原因 A：沒有使用複習功能
- ✅ 新增錯題 → `last_reviewed_at` = NULL
- ❌ 只有透過「答對/答錯」複習 → `last_reviewed_at` 才會更新

#### 原因 B：時區問題
- Supabase 使用 UTC 時間
- 本地時間可能不同
- 導致「昨天」的判斷錯誤

#### 原因 C：資料不一致
- `DailyTrendChart` 和 `DayStreakCounter` 讀取不同的資料來源

## 🔍 除錯步驟

### Step 1: 檢查資料庫中的 `last_reviewed_at`

在瀏覽器 Console (F12) 執行：

```javascript
// 1. 取得當前使用者的所有錯題
const { createBrowserClient } = await import('@supabase/ssr');
const supabase = createBrowserClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

const { data: questions, error } = await supabase
  .from('questions')
  .select('id, title, last_reviewed_at, created_at')
  .order('last_reviewed_at', { ascending: false, nullsFirst: false });

console.table(questions);
```

**預期結果：**
- 如果 `last_reviewed_at` 大多是 NULL → **原因 A**
- 如果有日期但不是今天/昨天 → **原因 B 或 C**

### Step 2: 手動呼叫 RPC 函數

```javascript
const { data, error } = await supabase.rpc('get_review_streak', {
  p_user_id: 'YOUR_USER_ID' // 從 Console 取得
});

console.log('連續天數:', data);
console.log('錯誤:', error);
```

### Step 3: 檢查 `get_review_stats` 的資料來源

```javascript
const { data: stats, error: statsError } = await supabase.rpc('get_review_stats', {
  p_user_id: 'YOUR_USER_ID',
  p_days: 30
});

console.table(stats);
```

**比對：**
- 如果 `get_review_stats` 有資料，但 `get_review_streak` 沒有
- → 兩個函數讀取的資料來源不同

## ✅ 解決方案

### 方案 1：修改 SQL 函數邏輯（推薦）

將 `get_review_streak` 改為讀取與 `get_review_stats` 相同的資料來源：

```sql
-- 選項 A：從 review_records 表讀取（如果有）
-- 選項 B：從 questions.created_at 讀取（新增錯題也算）
-- 選項 C：放寬時間條件（3 天內都算）
```

### 方案 2：確保使用複習功能

每次查看錯題後，點擊「答對」或「答錯」按鈕，這樣才會更新 `last_reviewed_at`。

### 方案 3：初始化 `last_reviewed_at`

新增錯題時，自動設定 `last_reviewed_at = NOW()`：

```sql
-- 在 questions 表的 created_at trigger 中加入
NEW.last_reviewed_at := NOW();
```

## 📊 建議

根據您的使用情境：

1. **如果「新增錯題」算作一次複習**：
   - 使用方案 3：初始化 `last_reviewed_at`

2. **如果只有「答對/答錯」才算複習**：
   - 保持現有邏輯，提醒使用者要點擊複習按鈕

3. **如果想要更靈活的計算**：
   - 使用方案 1：修改 SQL 函數，支援多種資料來源

---

## 🚀 快速修復（臨時方案）

如果急著讓它顯示數字，可以先手動更新資料：

```sql
-- 將所有錯題的 last_reviewed_at 設為 created_at
UPDATE questions
SET last_reviewed_at = created_at
WHERE last_reviewed_at IS NULL;
```

⚠️ **注意**：這會讓所有錯題都顯示為「複習過」，可能不符合實際情況。

---

**最後更新**: 2025-10-06
**狀態**: 待使用者除錯確認
