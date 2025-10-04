// ============================================
// Folder Types - TypeScript 型別定義
// 說明：資料夾相關的型別定義
// ============================================

/**
 * 資料夾層級常數
 */
export const MAX_FOLDER_LEVEL = 4 as const;
export const MIN_FOLDER_LEVEL = 1 as const;

/**
 * 資料夾名稱長度限制
 */
export const FOLDER_NAME_MIN_LENGTH = 1 as const;
export const FOLDER_NAME_MAX_LENGTH = 50 as const;

/**
 * 資料庫中的 Folder 資料結構
 */
export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  level: number;
  created_at: string;
  updated_at: string;
}

/**
 * 新增資料夾的請求資料
 */
export interface CreateFolderInput {
  name: string;
  parent_id?: string | null;
}

/**
 * 更新資料夾的請求資料
 */
export interface UpdateFolderInput {
  name: string;
}

/**
 * 資料夾樹狀結構（含子資料夾）
 */
export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
  path: string; // 完整路徑，例如：「數學 > 代數 > 一元二次方程式」
  hasChildren: boolean;
}

/**
 * 資料夾統計資訊
 */
export interface FolderStats {
  total_folders: number;
  folders_by_level: {
    level_1: number;
    level_2: number;
    level_3: number;
    level_4: number;
  };
  total_questions: number; // 該資料夾及子資料夾的錯題總數
}

/**
 * 資料夾路徑項目（麵包屑導航用）
 */
export interface FolderPathItem {
  id: string;
  name: string;
  level: number;
}

/**
 * API 回應：取得資料夾列表
 */
export interface GetFoldersResponse {
  folders: Folder[];
  total: number;
}

/**
 * API 回應：取得資料夾樹狀結構
 */
export interface GetFolderTreeResponse {
  tree: FolderTreeNode[];
}

/**
 * API 統一回應格式
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  error_code?: string;
}

/**
 * API 錯誤回應
 */
export interface FolderErrorResponse {
  error: string;
  code: 'FOLDER_NOT_FOUND' | 'MAX_LEVEL_REACHED' | 'DUPLICATE_NAME' | 'HAS_CHILDREN' | 'INVALID_INPUT' | 'UNAUTHORIZED';
  details?: string;
}

/**
 * 資料夾驗證錯誤
 */
export class FolderValidationError extends Error {
  constructor(
    message: string,
    public code: FolderErrorResponse['code'],
    public details?: string
  ) {
    super(message);
    this.name = 'FolderValidationError';
  }
}
