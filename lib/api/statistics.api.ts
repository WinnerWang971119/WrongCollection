// ============================================
// Statistics API - 統計資料 API 客戶端
// 說明：封裝統計相關的 RPC 函數呼叫
// ============================================

import { createBrowserClient } from '@supabase/ssr';

// 建立 Supabase 客戶端（Client Component 使用）
function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ============================================
// 型別定義
// ============================================

/**
 * 複習連續天數
 */
export interface ReviewStreak {
  current_streak: number;  // 當前連續天數
  longest_streak: number;  // 最長連續天數
}

/**
 * 單日複習統計
 */
export interface DailyReviewStat {
  date: string;           // 日期 (YYYY-MM-DD)
  total_reviews: number;  // 總複習數
  correct_reviews: number; // 答對數
  average_quality: number; // 平均評分 (1-5)
}

/**
 * 錯題分布
 */
export interface QuestionDistribution {
  category: string;       // 分類名稱
  count: number;          // 錯題數量
  percentage: number;     // 百分比
}

/**
 * 學習進度（單日）
 */
export interface LearningProgressDay {
  date: string;           // 日期 (YYYY-MM-DD)
  new_count: number;      // new 狀態題數
  learning_count: number; // learning 狀態題數
  review_count: number;   // review 狀態題數
  mastered_count: number; // mastered 狀態題數
  total_count: number;    // 總題數
}

/**
 * 記憶強度趨勢（單日）
 */
export interface EasinessTrendDay {
  date: string;           // 日期 (YYYY-MM-DD)
  average_ef: number;     // 平均 EF
  min_ef: number;         // 最小 EF
  max_ef: number;         // 最大 EF
  question_count: number; // 題數
}

/**
 * 複習效率統計
 */
export interface ReviewEfficiency {
  total_reviews: number;      // 總複習次數
  correct_reviews: number;    // 正確複習次數
  accuracy_rate: number;      // 正確率 (%)
  average_quality: number;    // 平均質量 (1-4)
  total_questions: number;    // 總錯題數
  mastered_questions: number; // 已精通題數
}

/**
 * 時間範圍類型
 */
export type TimeRange = 7 | 30 | 90 | 'all';

/**
 * 分組類型
 */
export type GroupByType = 'folder' | 'difficulty' | 'time';

// ============================================
// API 函數
// ============================================

/**
 * 取得複習連續天數
 * @returns Promise<ReviewStreak>
 */
export async function getReviewStreak(): Promise<ReviewStreak> {
  const supabase = createClient();

  // 1. 取得當前使用者
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ 認證失敗:', authError);
    throw new Error('未授權');
  }

  console.log('📊 呼叫 get_review_streak RPC...', { userId: user.id });

  // 2. 呼叫 RPC 函數
  const { data, error } = await supabase.rpc('get_review_streak', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('❌ 取得連續天數失敗:', error);
    throw new Error(`取得連續天數失敗: ${error.message}`);
  }

  console.log('✅ 取得連續天數成功:', data);

  // 3. 返回資料（RPC 返回陣列，取第一個元素）
  const result = Array.isArray(data) ? data[0] : data;
  
  return {
    current_streak: result?.current_streak ?? 0,
    longest_streak: result?.longest_streak ?? 0,
  };
}

/**
 * 取得每日複習統計
 * @param days 天數（預設 30 天）
 * @returns Promise<DailyReviewStat[]>
 */
export async function getReviewStats(days: number = 30): Promise<DailyReviewStat[]> {
  const supabase = createClient();

  // 1. 取得當前使用者
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ 認證失敗:', authError);
    throw new Error('未授權');
  }

  console.log('📊 呼叫 get_review_stats RPC...', { userId: user.id, days });

  // 2. 呼叫 RPC 函數
  const { data, error } = await supabase.rpc('get_review_stats', {
    p_user_id: user.id,
    p_days: days,
  });

  if (error) {
    console.error('❌ 取得複習統計失敗:', error);
    throw new Error(`取得複習統計失敗: ${error.message}`);
  }

  console.log('✅ 取得複習統計成功:', data);

  // 3. 返回資料（確保是陣列）
  return data ?? [];
}

/**
 * 取得錯題分布
 * @param groupBy 分組方式：'folder' | 'difficulty' | 'time'
 * @returns Promise<QuestionDistribution[]>
 */
export async function getQuestionDistribution(
  groupBy: GroupByType = 'folder'
): Promise<QuestionDistribution[]> {
  const supabase = createClient();

  // 1. 取得當前使用者
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ 認證失敗:', authError);
    throw new Error('未授權');
  }

  console.log('📊 呼叫 get_question_distribution RPC...', { userId: user.id, groupBy });

  // 2. 呼叫 RPC 函數
  const { data, error } = await supabase.rpc('get_question_distribution', {
    p_user_id: user.id,
    p_group_by: groupBy,
  });

  if (error) {
    console.error('❌ 取得錯題分布失敗:', error);
    throw new Error(`取得錯題分布失敗: ${error.message}`);
  }

  console.log('✅ 取得錯題分布成功:', data);

  // 3. 返回資料
  return data ?? [];
}

/**
 * 取得學習進度
 * @param days 天數（7, 30, 90 或 'all'）
 * @returns Promise<LearningProgressDay[]>
 */
export async function getLearningProgress(
  days: TimeRange = 30
): Promise<LearningProgressDay[]> {
  const supabase = createClient();

  // 1. 取得當前使用者
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ 認證失敗:', authError);
    throw new Error('未授權');
  }

  // 轉換 'all' 為大數字（365 天）
  const actualDays = days === 'all' ? 365 : days;

  console.log('📊 呼叫 get_learning_progress RPC...', { userId: user.id, days: actualDays });

  // 2. 呼叫 RPC 函數
  const { data, error } = await supabase.rpc('get_learning_progress', {
    p_user_id: user.id,
    p_days: actualDays,
  });

  if (error) {
    console.error('❌ 取得學習進度失敗:', error);
    throw new Error(`取得學習進度失敗: ${error.message}`);
  }

  console.log('✅ 取得學習進度成功:', data);

  // 3. 返回資料
  return data ?? [];
}

/**
 * 取得記憶強度趨勢
 * @param days 天數（7, 30, 90 或 'all'）
 * @returns Promise<EasinessTrendDay[]>
 */
export async function getEasinessTrend(
  days: TimeRange = 30
): Promise<EasinessTrendDay[]> {
  const supabase = createClient();

  // 1. 取得當前使用者
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ 認證失敗:', authError);
    throw new Error('未授權');
  }

  // 轉換 'all' 為大數字（365 天）
  const actualDays = days === 'all' ? 365 : days;

  console.log('📊 呼叫 get_easiness_trend RPC...', { userId: user.id, days: actualDays });

  // 2. 呼叫 RPC 函數
  const { data, error } = await supabase.rpc('get_easiness_trend', {
    p_user_id: user.id,
    p_days: actualDays,
  });

  if (error) {
    console.error('❌ 取得記憶強度趨勢失敗:', error);
    throw new Error(`取得記憶強度趨勢失敗: ${error.message}`);
  }

  console.log('✅ 取得記憶強度趨勢成功:', data);

  // 3. 返回資料
  return data ?? [];
}

/**
 * 取得複習效率統計
 * @param days 天數（7, 30, 90 或 'all'）
 * @returns Promise<ReviewEfficiency>
 */
export async function getReviewEfficiency(
  days: TimeRange = 30
): Promise<ReviewEfficiency> {
  const supabase = createClient();

  // 1. 取得當前使用者
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ 認證失敗:', authError);
    throw new Error('未授權');
  }

  // 轉換 'all' 為大數字（365 天）
  const actualDays = days === 'all' ? 365 : days;

  console.log('📊 呼叫 get_review_efficiency RPC...', { userId: user.id, days: actualDays });

  // 2. 呼叫 RPC 函數
  const { data, error } = await supabase.rpc('get_review_efficiency', {
    p_user_id: user.id,
    p_days: actualDays,
  });

  if (error) {
    console.error('❌ 取得複習效率失敗:', error);
    throw new Error(`取得複習效率失敗: ${error.message}`);
  }

  console.log('✅ 取得複習效率成功:', data);

  // 3. 返回資料（RPC 返回陣列，取第一個元素）
  const result = Array.isArray(data) ? data[0] : data;

  return {
    total_reviews: result?.total_reviews ?? 0,
    correct_reviews: result?.correct_reviews ?? 0,
    accuracy_rate: result?.accuracy_rate ?? 0,
    average_quality: result?.average_quality ?? 0,
    total_questions: result?.total_questions ?? 0,
    mastered_questions: result?.mastered_questions ?? 0,
  };
}
