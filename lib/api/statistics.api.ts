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
