// ============================================
// API Route: POST /api/questions/[id]/review
// 功能：手動複習 - 標記答對或答錯
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// 請求驗證 schema
const reviewSchema = z.object({
  result: z.enum(['correct', 'wrong'], {
    message: '結果必須是 correct 或 wrong',
  }),
});

/**
 * POST /api/questions/[id]/review
 * 標記錯題為答對或答錯
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const questionId = params.id;

    // 驗證使用者
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', error_code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 驗證請求資料
    const body = await request.json();
    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          error_code: 'VALIDATION_ERROR',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { result } = validation.data;

    // 檢查錯題是否存在且屬於當前使用者
    const { data: question, error: checkError } = await supabase
      .from('questions')
      .select('id, user_id, wrong_count')
      .eq('id', questionId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !question) {
      return NextResponse.json(
        { error: 'Question not found', error_code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 根據結果更新錯題
    if (result === 'correct') {
      // 答對：錯誤次數 -1（最低 0）
      const { error: updateError } = await supabase.rpc('mark_as_mastered', {
        p_question_id: questionId,
      });

      if (updateError) {
        console.error('標記答對失敗:', updateError);
        return NextResponse.json(
          { error: 'Failed to mark as correct', error_code: 'UPDATE_FAILED' },
          { status: 500 }
        );
      }
    } else {
      // 答錯：錯誤次數 +1
      const { error: updateError } = await supabase.rpc('increment_wrong_count', {
        p_question_id: questionId,
      });

      if (updateError) {
        console.error('標記答錯失敗:', updateError);
        return NextResponse.json(
          { error: 'Failed to mark as wrong', error_code: 'UPDATE_FAILED' },
          { status: 500 }
        );
      }
    }

    // 獲取更新後的錯題資料
    const { data: updatedQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('id, wrong_count, last_reviewed_at')
      .eq('id', questionId)
      .single();

    if (fetchError) {
      console.error('獲取更新後的錯題失敗:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch updated question', error_code: 'FETCH_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedQuestion,
      message: result === 'correct' ? '已標記為答對' : '已標記為答錯',
    });
  } catch (error) {
    console.error('手動複習 API 錯誤:', error);
    return NextResponse.json(
      { error: 'Internal server error', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
