// ============================================
// Question API Client - 錯題 API 客戶端函數
// ============================================

import type {
  Question,
  QuestionWithFolders,
  QuestionListItem,
  CreateQuestionInput,
  UpdateQuestionInput,
  QuestionQueryParams,
  ApiResponse,
} from '@/types/question.types';

const API_BASE_URL = '/api/questions';

/**
 * 新增錯題
 */
export async function createQuestion(input: CreateQuestionInput): Promise<Question> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<Question> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '建立錯題失敗');
  }

  return data.data!;
}

/**
 * 取得錯題列表
 */
export async function getQuestions(
  params?: QuestionQueryParams
): Promise<QuestionListItem[]> {
  const searchParams = new URLSearchParams();

  if (params?.folder_id) searchParams.append('folder_id', params.folder_id);
  if (params?.include_subfolders) searchParams.append('include_subfolders', 'true');
  if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());

  const url = `${API_BASE_URL}?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: ApiResponse<QuestionListItem[]> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '取得錯題列表失敗');
  }

  return data.data || [];
}

/**
 * 取得單筆錯題（含所屬資料夾）
 */
export async function getQuestionById(id: string): Promise<QuestionWithFolders> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: ApiResponse<QuestionWithFolders> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '取得錯題失敗');
  }

  return data.data!;
}

/**
 * 更新錯題
 */
export async function updateQuestion(
  id: string,
  input: UpdateQuestionInput
): Promise<Question> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<Question> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '更新錯題失敗');
  }

  return data.data!;
}

/**
 * 刪除錯題
 */
export async function deleteQuestion(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: ApiResponse<{ id: string }> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '刪除錯題失敗');
  }
}

/**
 * 標記答錯（錯誤次數 +1）
 */
export async function markAsWrong(id: string): Promise<{
  id: string;
  wrong_count: number;
  last_reviewed_at: string;
}> {
  const response = await fetch(`${API_BASE_URL}/${id}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ result: 'wrong' }),
  });

  const data: ApiResponse<{
    id: string;
    wrong_count: number;
    last_reviewed_at: string;
  }> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '標記答錯失敗');
  }

  return data.data!;
}

/**
 * 標記答對（錯誤次數 -1，最低 0）
 */
export async function markAsCorrect(id: string): Promise<{
  id: string;
  wrong_count: number;
  last_reviewed_at: string;
}> {
  const response = await fetch(`${API_BASE_URL}/${id}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ result: 'correct' }),
  });

  const data: ApiResponse<{
    id: string;
    wrong_count: number;
    last_reviewed_at: string;
  }> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '標記答對失敗');
  }

  return data.data!;
}
