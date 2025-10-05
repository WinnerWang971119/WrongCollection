# Supabase Storage 設定指南

## 📦 Storage Bucket 建立步驟

### 1. 前往 Supabase Dashboard
1. 開啟 Supabase Dashboard: https://supabase.com/dashboard
2. 選擇你的專案：**WrongCollection**
3. 左側選單點擊 **Storage**

---

### 2. 建立新的 Bucket

點擊 **New Bucket**，設定如下：

```
Name: question-images
Public bucket: ✅ 勾選（讓圖片可以公開存取）
Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/heic
File size limit: 5 MB
```

---

### 3. 設定 RLS 政策

建立 Bucket 後，點擊 **question-images** → **Policies** → **New Policy**

#### Policy 1: 公開讀取（Anyone can view images）
```sql
Policy name: Anyone can view images
Allowed operation: SELECT
Policy definition:

true
```

#### Policy 2: 使用者上傳自己的圖片（Users can upload own images）
```sql
Policy name: Users can upload own images
Allowed operation: INSERT
Policy definition:

bucket_id = 'question-images' 
AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 3: 使用者刪除自己的圖片（Users can delete own images）
```sql
Policy name: Users can delete own images
Allowed operation: DELETE
Policy definition:

bucket_id = 'question-images'
AND (storage.foldername(name))[1] = auth.uid()::text
```

---

### 4. 測試 Bucket

#### 測試上傳（使用 SQL Editor）
```sql
-- 測試上傳檔案
SELECT storage.upload(
  'question-images',
  'test-user-id/test.jpg',
  decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
  'image/jpeg'
);

-- 測試取得 Public URL
SELECT storage.get_public_url('question-images', 'test-user-id/test.jpg');

-- 測試刪除
SELECT storage.delete('question-images', ARRAY['test-user-id/test.jpg']);
```

---

## ✅ 驗證清單

完成後請確認：

- [ ] Bucket `question-images` 已建立
- [ ] Public bucket 已勾選
- [ ] 3 個 RLS 政策都已建立
- [ ] 測試上傳成功
- [ ] 測試取得 URL 成功
- [ ] 測試刪除成功

---

## 📝 後續步驟

Storage 設定完成後，請在 VS Code 終端機執行：

```bash
# 執行 Migration 003
# 方法1: 在 Supabase Dashboard 的 SQL Editor 中執行
# 方法2: 使用 Supabase CLI（如有安裝）
supabase db push
```

然後回到 VS Code，繼續下一個階段的開發。

---

## 🔍 故障排除

### 問題：上傳失敗「new row violates row-level security policy」
**解決**：檢查 Policy 2 的 `auth.uid()` 是否與上傳路徑的 user_id 一致

### 問題：無法刪除圖片
**解決**：檢查 Policy 3 是否正確設定

### 問題：圖片 URL 無法存取
**解決**：確認 Public bucket 已勾選

---

完成後請告知，我們繼續下一步！🚀
