// ============================================
// Folder Constants - 資料夾相關常數
// 說明：集中管理資料夾系統的所有常數
// ============================================

/**
 * 資料夾層級限制
 */
export const FOLDER_LEVELS = {
  MIN: 1,
  MAX: 4,
} as const;

/**
 * 資料夾名稱長度限制
 */
export const FOLDER_NAME_LENGTH = {
  MIN: 1,
  MAX: 50,
} as const;

/**
 * 資料夾驗證訊息
 */
export const FOLDER_VALIDATION_MESSAGES = {
  NAME_REQUIRED: '資料夾名稱為必填',
  NAME_TOO_SHORT: `資料夾名稱至少需要 ${FOLDER_NAME_LENGTH.MIN} 個字元`,
  NAME_TOO_LONG: `資料夾名稱最多 ${FOLDER_NAME_LENGTH.MAX} 個字元`,
  NAME_INVALID_CHARS: '資料夾名稱不可包含特殊字元：/ \\ : * ? " < > |',
  MAX_LEVEL_REACHED: `無法創建超過 ${FOLDER_LEVELS.MAX} 層的資料夾`,
  PARENT_NOT_FOUND: '父資料夾不存在',
  FOLDER_NOT_FOUND: '資料夾不存在',
  DUPLICATE_NAME: '同層資料夾中已存在相同名稱',
  HAS_CHILDREN: '無法刪除含有子資料夾的資料夾',
  HAS_SUBFOLDERS: '無法刪除含有子資料夾的資料夾',
  UNAUTHORIZED: '您沒有權限操作此資料夾',
} as const;

/**
 * 資料夾圖示（依層級）
 */
export const FOLDER_ICONS = {
  LEVEL_1: '📁', // 根資料夾
  LEVEL_2: '📂', // 第二層
  LEVEL_3: '🗂️', // 第三層
  LEVEL_4: '📄', // 第四層
} as const;

/**
 * 資料夾顏色（依層級，用於 UI 顯示）
 */
export const FOLDER_COLORS = {
  LEVEL_1: 'text-blue-600',
  LEVEL_2: 'text-indigo-600',
  LEVEL_3: 'text-purple-600',
  LEVEL_4: 'text-pink-600',
} as const;

/**
 * 預設資料夾名稱建議
 */
export const DEFAULT_FOLDER_NAMES = [
  '數學',
  '英文',
  '物理',
  '化學',
  '生物',
  '歷史',
  '地理',
  '公民',
] as const;
