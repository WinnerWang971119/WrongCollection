import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CustomReviewQuery {
  folder_ids?: string[];
  difficulties?: string[];
  review_states?: string[];
  days_since_review?: number;
  min_wrong_count?: number;
  max_wrong_count?: number;
  limit?: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 檢查認證
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

    // 解析請求參數
    const body: CustomReviewQuery = await request.json();
    console.log('📋 自訂複習查詢:', body);

    const {
      folder_ids = [],
      difficulties = [],
      review_states = [],
      days_since_review,
      min_wrong_count,
      max_wrong_count,
      limit = 50,
    } = body;

    // 建立查詢
    let query = supabase
      .from('questions')
      .select(`
        id,
        title,
        difficulty,
        wrong_count,
        review_state,
        next_review_date,
        last_quality,
        repetitions,
        last_reviewed_at,
        created_at
      `)
      .eq('user_id', user.id);

    // ✅ 新增：先取得使用者的所有資料夾 ID
    const { data: userFolders } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', user.id);

    if (!userFolders || userFolders.length === 0) {
      // 使用者沒有任何資料夾
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const userFolderIds = userFolders.map(f => f.id);

    // ✅ 取得所有有資料夾的錯題 ID（過濾孤兒錯題）
    const { data: validQuestionIds } = await supabase
      .from('question_folders')
      .select('question_id')
      .in('folder_id', userFolderIds);

    if (!validQuestionIds || validQuestionIds.length === 0) {
      // 沒有任何錯題屬於資料夾
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const validIds = [...new Set(validQuestionIds.map(qf => qf.question_id))];
    query = query.in('id', validIds);

    // 篩選：資料夾（如果指定）
    if (folder_ids.length > 0) {
      // 需要 JOIN question_folders 表
      const { data: questionIds } = await supabase
        .from('question_folders')
        .select('question_id')
        .in('folder_id', folder_ids);

      if (questionIds && questionIds.length > 0) {
        const ids = questionIds.map(qf => qf.question_id);
        query = query.in('id', ids);
      } else {
        // 沒有符合的題目
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
        });
      }
    }

    // 篩選：難度
    if (difficulties.length > 0) {
      query = query.in('difficulty', difficulties);
    }

    // 篩選：複習狀態
    if (review_states.length > 0) {
      query = query.in('review_state', review_states);
    }

    // 篩選：距離上次複習時間
    if (days_since_review !== undefined && days_since_review > 0) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - days_since_review);
      query = query.or(`last_reviewed_at.is.null,last_reviewed_at.lte.${targetDate.toISOString()}`);
    }

    // 篩選：錯誤次數範圍
    if (min_wrong_count !== undefined) {
      query = query.gte('wrong_count', min_wrong_count);
    }
    if (max_wrong_count !== undefined) {
      query = query.lte('wrong_count', max_wrong_count);
    }

    // 排序和限制
    query = query
      .order('wrong_count', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit);

    // 執行查詢
    const { data: questions, error: queryError } = await query;

    if (queryError) {
      console.error('❌ 查詢錯誤:', queryError);
      return NextResponse.json(
        { success: false, error: '查詢失敗' },
        { status: 500 }
      );
    }

    console.log(`✅ 找到 ${questions?.length || 0} 題符合條件`);

    return NextResponse.json({
      success: true,
      data: questions || [],
      count: questions?.length || 0,
    });
  } catch (error) {
    console.error('❌ API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
