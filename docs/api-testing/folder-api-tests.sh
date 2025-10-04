# ============================================
# Folder API 測試指南
# 說明：使用 curl 測試 Folder API 的所有端點
# ============================================

## 前置準備
# 1. 確保開發伺服器正在運行：npm run dev
# 2. 確保已登入並取得 Session Cookie
# 3. 將 <FOLDER_ID> 替換為實際的資料夾 ID

# ============================================
# 1. GET /api/folders - 取得所有資料夾
# ============================================

# 取得所有資料夾（平面列表）
curl -X GET "http://localhost:3000/api/folders" \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 取得資料夾樹狀結構
curl -X GET "http://localhost:3000/api/folders?include_children=true" \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 取得特定父資料夾的子資料夾
curl -X GET "http://localhost:3000/api/folders?parent_id=<FOLDER_ID>" \
  -H "Content-Type: application/json" \
  -b cookies.txt

# ============================================
# 2. POST /api/folders - 建立資料夾
# ============================================

# 建立根資料夾
curl -X POST "http://localhost:3000/api/folders" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "數學",
    "parent_id": null
  }'

# 建立子資料夾
curl -X POST "http://localhost:3000/api/folders" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "代數",
    "parent_id": "<PARENT_FOLDER_ID>"
  }'

# 測試：超過 50 字元（應失敗）
curl -X POST "http://localhost:3000/api/folders" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "這是一個超級超級超級超級超級超級超級超級超級超級超級超級超級超級超級超級長的名稱",
    "parent_id": null
  }'

# 測試：包含特殊字元（應失敗）
curl -X POST "http://localhost:3000/api/folders" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "數學/代數",
    "parent_id": null
  }'

# 測試：超過 4 層（應失敗）
# 需先建立 4 層資料夾，再嘗試建立第 5 層

# ============================================
# 3. PATCH /api/folders/[id] - 更新資料夾
# ============================================

# 更新資料夾名稱
curl -X PATCH "http://localhost:3000/api/folders/<FOLDER_ID>" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "進階數學"
  }'

# 測試：更新為重複名稱（應失敗）
curl -X PATCH "http://localhost:3000/api/folders/<FOLDER_ID>" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "已存在的資料夾名稱"
  }'

# ============================================
# 4. DELETE /api/folders/[id] - 刪除資料夾
# ============================================

# 刪除空資料夾
curl -X DELETE "http://localhost:3000/api/folders/<FOLDER_ID>" \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 測試：刪除有子資料夾的資料夾（應失敗）
curl -X DELETE "http://localhost:3000/api/folders/<FOLDER_ID_WITH_CHILDREN>" \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 強制刪除（包含子資料夾）
curl -X DELETE "http://localhost:3000/api/folders/<FOLDER_ID_WITH_CHILDREN>?force=true" \
  -H "Content-Type: application/json" \
  -b cookies.txt

# ============================================
# 預期回應範例
# ============================================

# 成功回應：
# {
#   "success": true,
#   "data": {
#     "id": "123e4567-e89b-12d3-a456-426614174000",
#     "user_id": "user-123",
#     "name": "數學",
#     "parent_id": null,
#     "level": 1,
#     "created_at": "2025-10-04T10:00:00Z",
#     "updated_at": "2025-10-04T10:00:00Z"
#   }
# }

# 錯誤回應：
# {
#   "success": false,
#   "error": "資料夾名稱最多 50 個字元",
#   "error_code": "VALIDATION_ERROR"
# }

# ============================================
# 測試流程建議
# ============================================

# 1. 建立根資料夾（Level 1）：數學
# 2. 建立子資料夾（Level 2）：代數
# 3. 建立孫資料夾（Level 3）：一元二次方程式
# 4. 建立曾孫資料夾（Level 4）：判別式
# 5. 嘗試建立 Level 5（應失敗）
# 6. 更新資料夾名稱
# 7. 嘗試刪除有子資料夾的資料夾（應失敗）
# 8. 強制刪除整個資料夾樹
# 9. 取得資料夾樹狀結構
