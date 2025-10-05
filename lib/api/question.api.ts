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
import type { SM2Result } from '@/lib/algorithms/sm2';

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

/**
 * 提交複習品質評分（SM-2 演算法）
 * 
 * @param id 錯題 ID
 * @param quality 品質評分（1:Again, 2:Hard, 3:Good, 4:Easy）
 * @returns 更新後的錯題和 SM-2 計算結果
 */
export async function submitReviewQuality(
  id: string,
  quality: 1 | 2 | 3 | 4
): Promise<{
  question: Question;
  sm2Result: SM2Result;
  stats: {
    totalReviews: number;
    correctReviews: number;
    accuracy: number;
    averageQuality: number;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/${id}/quality`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quality }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '提交複習品質失敗');
  }

  return data.data;
}

/**
 * 取得今日待複習題目
 * 
 * @param limit 最多回傳幾題（預設 50）
 * @returns 待複習題目列表
 */
export async function getDueQuestions(limit = 50): Promise<Array<{
  id: string;
  title: string;
  difficulty: string;
  wrong_count: number;
  review_state: string;
  next_review_date: string | null;
  last_quality: number | null;
  repetitions: number;
  is_overdue: boolean;
  days_overdue: number;
}>> {
  const response = await fetch(`${API_BASE_URL}?due=true&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    console.error('❌ API 回應:', data);
    throw new Error(data.error || '取得待複習題目失敗');
  }

  return data.data || [];
}

/**
 * 取得複習統計資料
 * 
 * @param days 過去幾天（預設 30）
 * @returns 每日複習統計
 */
export async function getReviewStats(days = 30): Promise<Array<{
  date: string;
  total_reviews: number;
  correct_reviews: number;
  average_quality: number;
}>> {
  const response = await fetch(`/api/stats/reviews?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '取得複習統計失敗');
  }

  return data.data || [];
}

/**
 * 取得連續複習天數
 * 
 * @returns 當前連續天數和最長記錄
 */
export async function getReviewStreak(): Promise<{
  current_streak: number;
  longest_streak: number;
}> {
  const response = await fetch('/api/stats/streak', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '取得連續天數失敗');
  }

  return data.data;
}
