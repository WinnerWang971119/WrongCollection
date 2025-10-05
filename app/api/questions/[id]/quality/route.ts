/**
 * POST /api/questions/[id]/quality
 * 
 * 提交複習品質評分，使用 SM-2 演算法計算下次複習時間
 * 
 * Request Body:
 * {
 *   "quality": 1 | 2 | 3 | 4  // 1:Again, 2:Hard, 3:Good, 4:Easy
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "question": Question,  // 更新後的錯題
 *     "sm2Result": SM2Result // SM-2 計算結果
 *   }
 * }
 */

import { createClient } from '@/lib/supabase/server';
import { 
  calculateNextReviewFromQuestion,
  ReviewQuality,
  type SM2Result 
} from '@/lib/algorithms/sm2';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const questionId = context.params.id;

    // 1. 驗證使用者登入
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ 認證失敗:', authError);
      return NextResponse.json(
        { success: false, error: '未登入' },
        { status: 401 }
      );
    }

    // 2. 解析請求
    const body = await request.json();
    const { quality } = body;

    // 3. 驗證 quality 值
    if (!quality || quality < 1 || quality > 4) {
      console.error('❌ 無效的品質評分:', quality);
      return NextResponse.json(
        { 
          success: false, 
          error: '品質評分必須介於 1-4 之間',
          error_code: 'INVALID_QUALITY'
        },
        { status: 400 }
      );
    }

    console.log(`📊 提交複習品質 - 題目: ${questionId}, 品質: ${quality}`);

    // 4. 取得當前錯題資料
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !question) {
      console.error('❌ 錯題不存在:', fetchError);
      return NextResponse.json(
        { 
          success: false, 
          error: '錯題不存在',
          error_code: 'QUESTION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    console.log('📖 當前錯題資料:', {
      title: question.title,
      easiness_factor: question.easiness_factor,
      repetitions: question.repetitions,
      interval: question.interval,
      review_state: question.review_state,
      total_reviews: question.total_reviews,
    });

    // 5. 計算 SM-2 演算法結果
    const sm2Result: SM2Result = calculateNextReviewFromQuestion(
      question,
      quality as ReviewQuality
    );

    console.log('🧮 SM-2 計算結果:', {
      newEF: sm2Result.easinessFactor.toFixed(2),
      newRepetitions: sm2Result.repetitions,
      newInterval: sm2Result.interval,
      nextReviewDate: sm2Result.nextReviewDate.toISOString().split('T')[0],
      reviewState: sm2Result.reviewState,
    });

    // 6. 判斷是否正確（quality >= 3）
    const isCorrect = quality >= ReviewQuality.GOOD;

    // 7. 更新錯題資料
    const updateData = {
      // SM-2 核心參數
      easiness_factor: sm2Result.easinessFactor,
      repetitions: sm2Result.repetitions,
      interval: sm2Result.interval,
      review_state: sm2Result.reviewState,
      next_review_date: sm2Result.nextReviewDate.toISOString(),
      
      // 複習記錄
      last_quality: quality,
      last_reviewed_at: new Date().toISOString(),
      total_reviews: (question.total_reviews || 0) + 1,
      correct_reviews: isCorrect 
        ? (question.correct_reviews || 0) + 1 
        : (question.correct_reviews || 0),
      
      // 首次複習時間
      first_reviewed_at: question.first_reviewed_at || new Date().toISOString(),
      
      // 精通時間（達到 mastered 狀態時記錄）
      graduated_at: sm2Result.reviewState === 'mastered' && !question.graduated_at
        ? new Date().toISOString()
        : question.graduated_at,
      
      // 錯誤次數（答錯時 +1，答對時不變）
      wrong_count: isCorrect 
        ? question.wrong_count 
        : question.wrong_count + 1,
      
      // 更新時間
      updated_at: new Date().toISOString(),
    };

    // 注意：average_quality 會由 Trigger 自動計算

    console.log('💾 更新資料:', updateData);

    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updatedQuestion) {
      console.error('❌ 更新失敗:', updateError);
      return NextResponse.json(
        { 
          success: false, 
          error: '更新錯題失敗',
          error_code: 'UPDATE_FAILED',
          details: updateError?.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ 複習記錄成功');
    console.log('📅 下次複習日期:', sm2Result.nextReviewDate.toISOString().split('T')[0]);
    console.log('📊 統計資料:', {
      total: updatedQuestion.total_reviews,
      correct: updatedQuestion.correct_reviews,
      accuracy: ((updatedQuestion.correct_reviews / updatedQuestion.total_reviews) * 100).toFixed(1) + '%',
    });

    // 8. 回傳結果
    return NextResponse.json({
      success: true,
      data: {
        question: updatedQuestion,
        sm2Result: {
          easinessFactor: sm2Result.easinessFactor,
          repetitions: sm2Result.repetitions,
          interval: sm2Result.interval,
          nextReviewDate: sm2Result.nextReviewDate.toISOString(),
          reviewState: sm2Result.reviewState,
        },
        stats: {
          totalReviews: updatedQuestion.total_reviews,
          correctReviews: updatedQuestion.correct_reviews,
          accuracy: (updatedQuestion.correct_reviews / updatedQuestion.total_reviews) * 100,
          averageQuality: updatedQuestion.average_quality,
        },
      },
    });

  } catch (error) {
    console.error('❌ API 錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '伺服器錯誤',
        error_code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
