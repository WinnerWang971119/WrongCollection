// ============================================
// Questions API - GET/PATCH/DELETE (單筆錯題)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateQuestionSchema, QUESTION_VALIDATION_MESSAGES } from '@/lib/validations/question.validation';
import type { Question, QuestionWithFolders, ApiResponse, QuestionFolder } from '@/types/question.types';

/**
 * GET /api/questions/[id]
 * 取得單筆錯題（含所屬資料夾列表）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // 驗證使用者登入
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '未授權：請先登入', error_code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id: questionId } = params;

    // 1. 取得錯題基本資料
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !question) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: QUESTION_VALIDATION_MESSAGES.QUESTION_NOT_FOUND, error_code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 2. 取得所屬資料夾列表
    const { data: questionFolders, error: foldersError } = await supabase
      .from('question_folders')
      .select('folder_id')
      .eq('question_id', questionId);

    if (foldersError) {
      console.error('Error fetching question folders:', foldersError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '取得資料夾列表失敗', error_code: 'FETCH_ERROR' },
        { status: 500 }
      );
    }

    const folderIds = (questionFolders || []).map(qf => qf.folder_id);

    // 3. 取得資料夾詳細資訊
    let folders: QuestionFolder[] = [];
    
    if (folderIds.length > 0) {
      const { data: folderData, error: folderDataError } = await supabase
        .from('folders')
        .select('id, name, level')
        .in('id', folderIds)
        .order('level', { ascending: true })
        .order('name', { ascending: true });

      if (!folderDataError && folderData) {
        folders = folderData;
      }
    }

    // 組合回應
    const questionWithFolders: QuestionWithFolders = {
      ...question,
      folders
    };

    return NextResponse.json<ApiResponse<QuestionWithFolders>>(
      { success: true, data: questionWithFolders },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET /api/questions/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: '伺服器錯誤', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/questions/[id]
 * 更新錯題
 * 
 * Body (所有欄位都是選填):
 * - title?: string
 * - question_text?: string
 * - question_image_url?: string
 * - my_answer?: string
 * - correct_answer?: string
 * - explanation?: string
 * - difficulty?: 'easy' | 'medium' | 'hard'
 * - folder_ids?: string[] (更新資料夾關聯)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // 驗證使用者登入
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '未授權：請先登入', error_code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id: questionId } = params;

    // 檢查錯題是否存在且屬於該使用者
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingQuestion) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: QUESTION_VALIDATION_MESSAGES.QUESTION_NOT_FOUND, error_code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 解析請求資料
    const body = await request.json();
    
    // Zod 驗證
    const validationResult = updateQuestionSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || '資料驗證失敗';
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: errorMessage, error_code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const {
      title,
      question_text,
      question_image_url,
      my_answer,
      correct_answer,
      explanation,
      difficulty,
      folder_ids
    } = validationResult.data;

    // 準備更新資料（只更新有提供的欄位）
    const updateData: Partial<Question> = {};
    
    if (title !== undefined) updateData.title = title;
    if (question_text !== undefined) updateData.question_text = question_text;
    if (question_image_url !== undefined) updateData.question_image_url = question_image_url;
    if (my_answer !== undefined) updateData.my_answer = my_answer;
    if (correct_answer !== undefined) updateData.correct_answer = correct_answer;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (difficulty !== undefined) updateData.difficulty = difficulty;

    // 1. 更新錯題
    if (Object.keys(updateData).length > 0) {
      const { data: updatedQuestion, error: updateError } = await supabase
        .from('questions')
        .update(updateData)
        .eq('id', questionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating question:', updateError);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: '更新錯題失敗', error_code: 'UPDATE_ERROR' },
          { status: 500 }
        );
      }
    }

    // 2. 更新資料夾關聯（如果有提供）
    if (folder_ids && folder_ids.length > 0) {
      // 驗證所有資料夾都存在且屬於該使用者
      const { data: folders, error: folderError } = await supabase
        .from('folders')
        .select('id')
        .in('id', folder_ids)
        .eq('user_id', user.id);

      if (folderError || !folders || folders.length !== folder_ids.length) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: '部分資料夾不存在或無權限存取', error_code: 'INVALID_FOLDERS' },
          { status: 400 }
        );
      }

      // 刪除舊的關聯
      await supabase
        .from('question_folders')
        .delete()
        .eq('question_id', questionId);

      // 建立新的關聯
      const relations = folder_ids.map(folderId => ({
        question_id: questionId,
        folder_id: folderId
      }));

      const { error: relationsError } = await supabase
        .from('question_folders')
        .insert(relations);

      if (relationsError) {
        console.error('Error updating question_folders relations:', relationsError);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: '更新資料夾關聯失敗', error_code: 'RELATION_ERROR' },
          { status: 500 }
        );
      }
    }

    // 取得更新後的完整資料
    const { data: finalQuestion, error: finalError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (finalError) {
      console.error('Error fetching updated question:', finalError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '取得更新後資料失敗', error_code: 'FETCH_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Question>>(
      { success: true, data: finalQuestion },
      { status: 200 }
    );

  } catch (error) {
    console.error('PATCH /api/questions/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: '伺服器錯誤', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/questions/[id]
 * 刪除錯題（CASCADE 自動刪除 question_folders 關聯）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // 驗證使用者登入
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '未授權：請先登入', error_code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id: questionId } = params;

    // 檢查錯題是否存在且屬於該使用者
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('id')
      .eq('id', questionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingQuestion) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: QUESTION_VALIDATION_MESSAGES.QUESTION_NOT_FOUND, error_code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 刪除錯題（CASCADE 會自動刪除 question_folders 關聯）
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting question:', deleteError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '刪除錯題失敗', error_code: 'DELETE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { success: true, data: { id: questionId } },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE /api/questions/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: '伺服器錯誤', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
