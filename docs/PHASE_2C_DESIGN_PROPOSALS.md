# Phase 2C：進階統計分析 - 設計方案

## 📊 目標功能

1. **錯題分布分析**：按資料夾、難度、時間分布
2. **學習進度追蹤**：掌握度曲線（review_state 變化）
3. **記憶強度分析**：easiness_factor 趨勢
4. **複習效率統計**：正確率、平均時間

---

## 🎨 版面設計方案

### 方案 A：卡片網格佈局（推薦 ⭐）

**布局**：2x2 網格，大對話框（max-w-7xl）

```
┌─────────────────────────────────────────────┐
│  🔍 學習分析 (AnalyticsDialog)             │
├────────────────┬────────────────────────────┤
│  📊 錯題分布   │  📈 學習進度追蹤           │
│  (圓餅圖)      │  (面積圖)                  │
│  • 按資料夾    │  • new → learning         │
│  • 按難度      │    → review → mastered    │
│  • 按時間      │  • 30天趨勢                │
├────────────────┼────────────────────────────┤
│  💪 記憶強度   │  ⚡ 複習效率               │
│  (折線圖)      │  (指標卡片)                │
│  • EF趨勢      │  • 正確率                  │
│  • 平均EF      │  • 平均質量                │
│  • 分布        │  • 總複習數                │
└────────────────┴────────────────────────────┘
```

**優點**：
- ✅ 資訊密度高，一目了然
- ✅ 響應式：手機版自動變成 1 列
- ✅ 開發快速，使用現有的 Recharts

**缺點**：
- ⚠️ 圖表較小，細節可能不清楚
- ⚠️ 需要 4 個獨立的 API 呼叫

---

### 方案 B：Tab 切換佈局

**布局**：單一區域 + Tab 切換

```
┌─────────────────────────────────────────────┐
│  🔍 學習分析                                │
│  [📊分布] [📈進度] [💪強度] [⚡效率]        │
├─────────────────────────────────────────────┤
│                                             │
│              大圖表區域                      │
│         (依 Tab 顯示不同內容)               │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**優點**：
- ✅ 圖表大，細節清楚
- ✅ 一次只需載入一個 Tab 的資料（效能好）
- ✅ 適合深入分析單一面向

**缺點**：
- ⚠️ 無法同時比對多個指標
- ⚠️ 需要多次點擊才能看到全部資料

---

### 方案 C：瀑布式單頁佈局

**布局**：垂直滾動，每個分析獨立佔據螢幕寬度

```
┌─────────────────────────────────────────────┐
│  🔍 學習分析                                │
├─────────────────────────────────────────────┤
│  📊 錯題分布分析                            │
│  ┌────────┬────────┬────────┐              │
│  │資料夾  │難度    │時間    │              │
│  └────────┴────────┴────────┘              │
├─────────────────────────────────────────────┤
│  📈 學習進度追蹤 (大面積圖)                 │
│  ┌─────────────────────────────┐           │
│  │                             │           │
│  └─────────────────────────────┘           │
├─────────────────────────────────────────────┤
│  💪 記憶強度分析 (折線圖)                   │
│  ...                                        │
├─────────────────────────────────────────────┤
│  ⚡ 複習效率統計 (指標卡片)                 │
│  ...                                        │
└─────────────────────────────────────────────┘
```

**優點**：
- ✅ 最清晰，每個圖表都很大
- ✅ 適合報告式呈現
- ✅ 容易截圖分享

**缺點**：
- ⚠️ 需要滾動查看全部
- ⚠️ 對話框需要很大（max-w-full）

---

## 🛠️ 實作方法

### 📦 技術選擇

**圖表庫**：Recharts（已安裝）
- PieChart（圓餅圖）：錯題分布
- AreaChart（面積圖）：學習進度
- LineChart（折線圖）：記憶強度趨勢
- BarChart（長條圖）：可選

**資料來源**：Supabase RPC Functions

---

### 🔧 需要建立的 RPC 函數

#### 1. `get_question_distribution` - 錯題分布

```sql
CREATE OR REPLACE FUNCTION get_question_distribution(
  p_user_id UUID,
  p_group_by TEXT DEFAULT 'folder' -- 'folder', 'difficulty', 'time'
)
RETURNS TABLE (
  category TEXT,
  count INTEGER,
  percentage FLOAT
)
```

**用途**：
- 按資料夾分組：資料夾名稱 + 錯題數
- 按難度分組：easy/medium/hard + 錯題數
- 按時間分組：本周/本月/更早 + 錯題數

---

#### 2. `get_learning_progress` - 學習進度

```sql
CREATE OR REPLACE FUNCTION get_learning_progress(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  new_count INTEGER,
  learning_count INTEGER,
  review_count INTEGER,
  mastered_count INTEGER
)
```

**用途**：
- 追蹤每天各狀態的錯題數量
- 顯示 new → learning → review → mastered 的流動

---

#### 3. `get_easiness_trend` - 記憶強度趨勢

```sql
CREATE OR REPLACE FUNCTION get_easiness_trend(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  average_ef FLOAT,
  min_ef FLOAT,
  max_ef FLOAT,
  question_count INTEGER
)
```

**用途**：
- 顯示平均 easiness_factor 的變化
- 判斷學習是否越來越輕鬆

---

#### 4. `get_review_efficiency` - 複習效率

```sql
CREATE OR REPLACE FUNCTION get_review_efficiency(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_reviews INTEGER,
  correct_reviews INTEGER,
  accuracy_rate FLOAT,
  average_quality FLOAT,
  total_questions INTEGER,
  mastered_questions INTEGER
)
```

**用途**：
- 總複習次數
- 正確率 = correct_reviews / total_reviews
- 平均質量（1-4 分）
- 已精通題目數量

---

### 📁 檔案結構

```
components/statistics/
├── DayStreakCounter.tsx        ✅ 已完成
├── DailyTrendChart.tsx         ✅ 已完成
├── AnalyticsDialog.tsx         ✅ 已完成（空殼）
├── QuestionDistribution.tsx    ⬜ 新增
├── LearningProgress.tsx        ⬜ 新增
├── EasinessTrend.tsx           ⬜ 新增
├── ReviewEfficiency.tsx        ⬜ 新增
└── index.ts

lib/api/
└── statistics.api.ts           ⬜ 新增 4 個 API 函數

supabase/migrations/
└── 005_add_analytics_rpc.sql   ⬜ 新增 4 個 RPC 函數
```

---

## 🚀 開發步驟（方案 A 為例）

### Phase 2C-1: 建立 RPC 函數
1. 撰寫 `005_add_analytics_rpc.sql`
2. 在 Supabase SQL Editor 執行
3. 測試每個函數是否正常運作

### Phase 2C-2: 建立 API 客戶端
1. 在 `statistics.api.ts` 新增 4 個函數：
   - `getQuestionDistribution(groupBy)`
   - `getLearningProgress(days)`
   - `getEasinessTrend(days)`
   - `getReviewEfficiency(days)`

### Phase 2C-3: 建立圖表元件
1. `QuestionDistribution.tsx`（3 個 Tab：資料夾/難度/時間）
2. `LearningProgress.tsx`（堆疊面積圖）
3. `EasinessTrend.tsx`（折線圖）
4. `ReviewEfficiency.tsx`（指標卡片網格）

### Phase 2C-4: 整合到 AnalyticsDialog
1. 更新 `AnalyticsDialog.tsx`
2. 使用 2x2 Grid 佈局
3. 加入 Loading 和 Error 狀態

### Phase 2C-5: 測試與優化
1. 測試各種資料情境
2. 優化載入速度
3. 調整顏色和樣式

---

## 🎯 推薦方案

### 我的建議：**方案 A（卡片網格佈局）**

**理由**：
1. **資訊密度最高**：一眼看到所有指標
2. **開發效率高**：使用現有的 Recharts，開發時間短
3. **響應式友好**：自動適應手機版
4. **符合 Dashboard 風格**：與現有的統計卡片一致

**實作時間估算**：
- RPC 函數：1-2 小時
- API 客戶端：30 分鐘
- 圖表元件：2-3 小時
- 整合測試：1 小時
- **總計：4-6 小時**

---

## 💡 進階功能（可選）

### 選項 1：資料匯出
- 匯出 CSV/JSON 格式
- 生成學習報告 PDF

### 選項 2：時間範圍選擇
- 下拉選單：最近 7 天 / 30 天 / 90 天 / 全部
- 自訂日期範圍

### 選項 3：互動功能
- 點擊圖表查看詳細資料
- Drill-down 深入分析
- 圖例切換顯示/隱藏

---

## 🎨 顏色方案

基於現有的藍色主題：

- **錯題分布**：藍色系漸層（#3b82f6, #60a5fa, #93c5fd）
- **學習進度**：
  - new: 灰色 #9ca3af
  - learning: 橙色 #fb923c
  - review: 藍色 #3b82f6
  - mastered: 綠色 #10b981
- **記憶強度**：紫色系漸層（#8b5cf6, #a78bfa）
- **複習效率**：綠色系（正確）+ 紅色系（錯誤）

---

## 📊 資料驗證

### 測試案例
1. **空資料**：新使用者，沒有任何錯題
2. **少量資料**：1-5 題錯題
3. **正常資料**：50-100 題錯題
4. **大量資料**：500+ 題錯題

### 效能考量
- 使用資料庫索引（已有）
- 限制查詢範圍（預設 30 天）
- 前端快取（SWR 或 React Query）

---

## 🤔 需要您決定的事項

### 1. 選擇版面方案
- [ ] 方案 A：卡片網格佈局（推薦）
- [ ] 方案 B：Tab 切換佈局
- [ ] 方案 C：瀑布式單頁佈局
- [ ] 自訂方案：__________

### 2. 圖表類型偏好
- **錯題分布**：圓餅圖 / 長條圖 / Treemap？
- **學習進度**：堆疊面積圖 / 折線圖 / 長條圖？
- **記憶強度**：折線圖 / 面積圖 / 散點圖？
- **複習效率**：指標卡片 / 雷達圖 / 環形圖？

### 3. 時間範圍
- [ ] 固定 30 天
- [ ] 可選擇（7/30/90/全部）

### 4. 進階功能
- [ ] 需要資料匯出
- [ ] 需要互動功能（點擊查看詳細）
- [ ] 需要時間範圍選擇器

---

## ✅ 下一步行動

**如果您選擇方案 A**，我將：

1. 建立 `005_add_analytics_rpc.sql`（4 個 RPC 函數）
2. 更新 `statistics.api.ts`（4 個 API 函數）
3. 建立 4 個圖表元件
4. 更新 `AnalyticsDialog.tsx`（2x2 Grid）
5. 測試與優化

預計完成時間：4-6 小時（分多次進行）

---

**文檔建立日期**：2025-10-06  
**狀態**：待使用者選擇方案  
**推薦方案**：方案 A（卡片網格佈局）
