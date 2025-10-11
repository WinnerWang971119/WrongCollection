# 🐛 除錯步驟 - 移除筆跡 500 錯誤

## 當前狀態

✅ 環境變數正確設定（測試腳本通過）  
✅ Replicate SDK 可以正常初始化  
❌ API Route 回傳 500 錯誤

## 🔍 除錯步驟

### Step 1: 確認 Dev Server 已重新啟動

**重要！** 必須先完成這步：

```bash
# 1. 停止現有 dev server (Ctrl+C)
# 2. 重新啟動
npm run dev
```

等待看到：
```
✓ Ready in Xs
○ Local:   http://localhost:3000
```

---

### Step 2: 測試功能並查看 Terminal 日誌

1. 開啟瀏覽器前往 http://localhost:3000/dashboard
2. 新增錯題 → 上傳圖片
3. 點擊「手動調整」
4. 點擊「🧹 移除筆跡 (AI)」
5. **立即查看 Terminal**（很重要！）

---

### Step 3: 檢查 Terminal 日誌

#### ✅ 正常的日誌應該是：

```
🧹 [API] 開始處理移除筆跡請求
✅ [API] 使用者已驗證: xxxx-xxxx-xxxx
📥 [API] 收到圖片和遮罩
✅ [API] API Token 已設定: r8_28gSm...
✅ [API] Replicate 客戶端初始化成功  ← 新增的日誌
🤖 [API] 呼叫 Replicate LaMa 模型...
📊 [API] 圖片大小: data:image/png;base64,iVBORw0KGgoAAAAN...
📊 [API] 遮罩大小: data:image/png;base64,iVBORw0KGgoAAAAN...
(等待 5-30 秒...)
✅ [API] Replicate 處理完成 (12543ms)
📤 [API] 結果 URL: https://replicate.delivery/...
```

#### ❌ 如果出現錯誤：

**情況 A：Token 未載入**
```
🧹 [API] 開始處理移除筆跡請求
❌ [API] 缺少 REPLICATE_API_TOKEN 環境變數
```
→ **解決**：Dev server 未重新啟動，回到 Step 1

---

**情況 B：Replicate 初始化失敗**
```
🧹 [API] 開始處理移除筆跡請求
✅ [API] API Token 已設定: r8_28gSm...
❌ [API] Replicate 初始化失敗: [錯誤訊息]
```
→ **解決**：查看具體錯誤訊息，可能是：
- Replicate 套件安裝問題 → `npm install replicate --force`
- Token 格式錯誤 → 檢查 `.env.local`

---

**情況 C：API 呼叫失敗**
```
✅ [API] Replicate 客戶端初始化成功
🤖 [API] 呼叫 Replicate LaMa 模型...
❌ [API] Replicate API 錯誤: [錯誤訊息]
```
→ **解決**：根據錯誤訊息：
- `unauthorized` → Token 無效
- `quota exceeded` → 額度不足
- `timeout` → 等待後重試
- `invalid input` → 圖片格式問題

---

**情況 D：認證失敗**
```
🧹 [API] 開始處理移除筆跡請求
❌ [API] 未授權
```
→ **解決**：使用者未登入，請先登入

---

**情況 E：其他錯誤**
```
❌ [API] 移除筆跡失敗: [錯誤訊息]
❌ [API] 錯誤詳情: { message: ..., name: ..., stack: ... }
```
→ **解決**：查看詳細的錯誤堆疊

---

### Step 4: 檢查瀏覽器 Console

開啟 DevTools → Console Tab，應該看到：

#### ✅ 成功：
```
🧹 開始移除筆跡...
🔍 正在檢測筆跡...
✅ Step 1: 轉換為灰階
✅ Step 2: 二值化檢測筆跡
✅ Step 3: 膨脹處理（連接筆畫）
✅ Step 4: 移除雜訊（保留 X 個筆跡區域）
✅ 筆跡檢測完成: { regions: 3, area: 12543, percentage: "2.34%" }
📤 正在呼叫 AI 模型...
🧹 呼叫 AI 移除筆跡 API...
✅ AI 移除筆跡成功 (8234ms)
```

#### ❌ 失敗：
```
❌ API 錯誤回應: {
  status: 500,
  statusText: "Internal Server Error",
  error: { error: "...", details: "..." }
}
❌ 移除筆跡錯誤: Error: [500] ...
```

如果是 500 錯誤，**立即回到 Terminal 查看詳細日誌**。

---

### Step 5: 常見問題快速檢查

#### Q1: 看到「❌ [API] 缺少 REPLICATE_API_TOKEN」？
✅ **解決**：重新啟動 dev server

```bash
# Terminal 按 Ctrl+C 停止
npm run dev
```

---

#### Q2: 看到「❌ [API] Replicate 初始化失敗」？
✅ **解決**：重新安裝 Replicate

```bash
npm install replicate --force
npm run dev
```

---

#### Q3: 看到「❌ [API] Replicate API 錯誤: unauthorized」？
✅ **解決**：Token 可能過期或錯誤

1. 前往 https://replicate.com/account/api-tokens
2. 檢查 Token 狀態
3. 如果需要，重新生成
4. 更新 `.env.local`
5. 重新啟動 dev server

---

#### Q4: 完全沒有 Terminal 日誌？
✅ **解決**：

1. 確認 dev server 正在運行
2. 確認瀏覽器正在訪問 `http://localhost:3000`（不是其他端口）
3. 清除瀏覽器快取後重試

---

## 📋 完整檢查清單

執行以下所有步驟：

- [ ] Step 1: 停止並重新啟動 dev server
- [ ] Step 2: 等待「✓ Ready」訊息
- [ ] Step 3: 前往 http://localhost:3000/dashboard
- [ ] Step 4: 上傳圖片並點擊「移除筆跡」
- [ ] Step 5: **立即查看 Terminal**（不要只看瀏覽器）
- [ ] Step 6: 複製完整的 Terminal 日誌
- [ ] Step 7: 複製完整的 Browser Console 日誌

---

## 🆘 如果還是失敗

請提供以下資訊：

### 1. Terminal 完整日誌
從「🧹 [API] 開始處理」開始，直到錯誤結束

### 2. Browser Console 完整日誌
從「🧹 開始移除筆跡」開始，直到錯誤結束

### 3. 測試腳本輸出
```bash
node scripts/test-replicate-token.js
```

### 4. Dev Server 啟動日誌
```bash
npm run dev
```
複製所有輸出（特別是有無錯誤訊息）

### 5. 環境變數檢查
```bash
# PowerShell
$env:REPLICATE_API_TOKEN.Substring(0,8)

# 應該顯示: r8_28gSm
```

---

## 💡 關鍵提示

1. **Always restart dev server** after changing `.env.local`
2. **Terminal logs are more important** than browser errors for API issues
3. **First API call takes 15-30s** (cold start is normal)
4. **Check Terminal immediately** after clicking the button

---

現在請執行 Step 1-5，然後告訴我你在 Terminal 看到什麼！
