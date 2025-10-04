// ============================================
// Folder API Client - React Hooks & 輔助函數
// 說明：用於前端呼叫 Folder API 的輔助函數
// ============================================

'use client';

import type { 
  Folder, 
  FolderTreeNode, 
  CreateFolderInput, 
  UpdateFolderInput,
  ApiResponse 
} from '@/types/folder.types';

/**
 * API Base URL
 */
const API_BASE = '/api/folders';

/**
 * 取得所有資料夾
 * @param options - 查詢選項
 * @returns 資料夾列表或樹狀結構
 */
export async function getFolders(options?: {
  parent_id?: string;
  include_children?: boolean;
}): Promise<Folder[] | FolderTreeNode[]> {
  const params = new URLSearchParams();
  
  if (options?.parent_id) {
    params.append('parent_id', options.parent_id);
  }
  
  if (options?.include_children) {
    params.append('include_children', 'true');
  }

  const response = await fetch(`${API_BASE}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiResponse<null> = await response.json();
    throw new Error(error.error || '取得資料夾失敗');
  }

  const result: ApiResponse<Folder[] | FolderTreeNode[]> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || '取得資料夾失敗');
  }

  return result.data;
}

/**
 * 建立新資料夾
 * @param input - 資料夾資料
 * @returns 建立的資料夾
 */
export async function createFolder(input: CreateFolderInput): Promise<Folder> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiResponse<null> = await response.json();
    throw new Error(error.error || '建立資料夾失敗');
  }

  const result: ApiResponse<Folder> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || '建立資料夾失敗');
  }

  return result.data;
}

/**
 * 更新資料夾
 * @param id - 資料夾 ID
 * @param input - 更新資料
 * @returns 更新後的資料夾
 */
export async function updateFolder(id: string, input: UpdateFolderInput): Promise<Folder> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiResponse<null> = await response.json();
    throw new Error(error.error || '更新資料夾失敗');
  }

  const result: ApiResponse<Folder> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || '更新資料夾失敗');
  }

  return result.data;
}

/**
 * 刪除資料夾
 * @param id - 資料夾 ID
 * @param force - 是否強制刪除（包含子資料夾）
 * @returns 刪除的資料夾 ID
 */
export async function deleteFolder(id: string, force = false): Promise<string> {
  const params = new URLSearchParams();
  
  if (force) {
    params.append('force', 'true');
  }

  const response = await fetch(`${API_BASE}/${id}?${params.toString()}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiResponse<null> = await response.json();
    throw new Error(error.error || '刪除資料夾失敗');
  }

  const result: ApiResponse<{ id: string }> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || '刪除資料夾失敗');
  }

  return result.data.id;
}

/**
 * 取得資料夾樹狀結構（根資料夾開始）
 * @returns 完整的資料夾樹
 */
export async function getFolderTree(): Promise<FolderTreeNode[]> {
  return getFolders({ include_children: true }) as Promise<FolderTreeNode[]>;
}

/**
 * 取得特定資料夾的子資料夾
 * @param parentId - 父資料夾 ID
 * @returns 子資料夾列表
 */
export async function getSubfolders(parentId: string): Promise<Folder[]> {
  return getFolders({ parent_id: parentId }) as Promise<Folder[]>;
}
