// ============================================
// Questions API - POST (新增錯題) & GET (取得列表)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createQuestionSchema, questionQuerySchema } from '@/lib/validations/question.validation';
import type { Question, QuestionListItem, ApiResponse } from '@/types/question.types';

/**
 * POST /api/questions
 * 新增錯題
 * 
 * Body:
 * - title: string (標題，1-100 字元)
 * - question_text?: string (題目文字，選填)
 * - question_image_url?: string (題目照片 URL，選填)
 * - my_answer: string (我的答案)
 * - correct_answer: string (正確答案)
 * - explanation?: string (詳解，選填)
 * - difficulty: 'easy' | 'medium' | 'hard'
 * - folder_ids: string[] (資料夾 ID 列表，至少一個)
 */
export async function POST(request: NextRequest) {
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

    // 解析請求資料
    const body = await request.json();
    
    // Zod 驗證
    const validationResult = createQuestionSchema.safeParse(body);
    
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

    // 1. 建立錯題
    const { data: question, error: insertError } = await supabase
      .from('questions')
      .insert({
        user_id: user.id,
        title,
        question_text: question_text || null,
        question_image_url: question_image_url || null,
        my_answer,
        correct_answer,
        explanation: explanation || null,
        difficulty,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating question:', insertError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '建立錯題失敗', error_code: 'CREATE_ERROR' },
        { status: 500 }
      );
    }

    // 2. 建立多對多關聯（錯題 ↔ 資料夾）
    const relations = folder_ids.map(folderId => ({
      question_id: question.id,
      folder_id: folderId
    }));

    const { error: relationsError } = await supabase
      .from('question_folders')
      .insert(relations);

    if (relationsError) {
      console.error('Error creating question_folders relations:', relationsError);
      // 如果關聯建立失敗，刪除已建立的錯題（回滾）
      await supabase.from('questions').delete().eq('id', question.id);
      
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '建立錯題關聯失敗', error_code: 'RELATION_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Question>>(
      { success: true, data: question },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/questions error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: '伺服器錯誤', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/questions
 * 取得錯題列表
 * 
 * Query Parameters:
 * - folder_id?: string (按資料夾篩選)
 * - include_subfolders?: boolean (是否包含子資料夾，預設 false)
 * - difficulty?: 'easy' | 'medium' | 'hard' (按難度篩選)
 * - search?: string (標題搜尋)
 * - limit?: number (每頁數量，預設 20)
 * - offset?: number (分頁偏移，預設 0)
 */
export async function GET(request: NextRequest) {
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

    // 解析查詢參數
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      folder_id: searchParams.get('folder_id') || undefined,
      include_subfolders: searchParams.get('include_subfolders') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
    };

    // 驗證查詢參數
    const validationResult = questionQuerySchema.safeParse(queryParams);
    
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '查詢參數格式錯誤', error_code: 'INVALID_PARAMS' },
        { status: 400 }
      );
    }

    const { folder_id, include_subfolders, difficulty, search, limit, offset } = validationResult.data;

    // 如果指定了資料夾且包含子資料夾，使用 RPC 函數
    if (folder_id && include_subfolders) {
      const { data: questions, error: rpcError } = await supabase
        .rpc('get_folder_questions_recursive', {
          p_folder_id: folder_id,
          p_user_id: user.id
        });

      if (rpcError) {
        console.error('Error fetching questions with subfolders:', rpcError);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: '取得錯題列表失敗', error_code: 'FETCH_ERROR' },
          { status: 500 }
        );
      }

      // 應用額外篩選
      let filteredQuestions = questions || [];
      
      if (difficulty) {
        filteredQuestions = filteredQuestions.filter((q: QuestionListItem) => q.difficulty === difficulty);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredQuestions = filteredQuestions.filter((q: QuestionListItem) => 
          q.title.toLowerCase().includes(searchLower)
        );
      }

      // 分頁
      const paginatedQuestions = filteredQuestions.slice(offset, offset + limit);

      return NextResponse.json<ApiResponse<QuestionListItem[]>>(
        { success: true, data: paginatedQuestions },
        { status: 200 }
      );
    }

    // 一般查詢（不含子資料夾或無指定資料夾）
    let query = supabase
      .from('questions')
      .select('id, title, difficulty, wrong_count, last_reviewed_at, created_at')
      .eq('user_id', user.id);

    // 如果指定了資料夾（但不含子資料夾）
    if (folder_id) {
      // 需要 JOIN question_folders 表
      const { data: folderQuestions, error: folderError } = await supabase
        .from('question_folders')
        .select('question_id')
        .eq('folder_id', folder_id);

      if (folderError) {
        console.error('Error fetching folder questions:', folderError);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: '取得資料夾錯題失敗', error_code: 'FETCH_ERROR' },
          { status: 500 }
        );
      }

      const questionIds = (folderQuestions || []).map(fq => fq.question_id);
      
      if (questionIds.length === 0) {
        return NextResponse.json<ApiResponse<QuestionListItem[]>>(
          { success: true, data: [] },
          { status: 200 }
        );
      }

      query = query.in('id', questionIds);
    }

    // 應用其他篩選
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // 排序、分頁
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: questions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching questions:', fetchError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '取得錯題列表失敗', error_code: 'FETCH_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<QuestionListItem[]>>(
      { success: true, data: questions || [] },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET /api/questions error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: '伺服器錯誤', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
