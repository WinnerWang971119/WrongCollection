// ============================================
// Folders API - GET (所有資料夾) & POST (新增資料夾)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createFolderSchema } from '@/lib/validations/folder.validation';
import { FOLDER_LEVELS, FOLDER_VALIDATION_MESSAGES } from '@/lib/constants/folder.constants';
import type { Folder, FolderTreeNode, ApiResponse } from '@/types/folder.types';

/**
 * GET /api/folders
 * 取得使用者的所有資料夾
 * 
 * Query Parameters:
 * - include_children: boolean (是否回傳樹狀結構)
 * - parent_id: string (篩選特定父資料夾的子資料夾)
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

    // 取得查詢參數
    const searchParams = request.nextUrl.searchParams;
    const includeChildren = searchParams.get('include_children') === 'true';
    const parentId = searchParams.get('parent_id');

    // 如果要樹狀結構，使用 get_folder_tree() 函數
    if (includeChildren) {
      const { data: treeData, error: treeError } = await supabase
        .rpc('get_folder_tree', { 
          p_user_id: user.id,
          p_parent_id: parentId || null 
        });

      if (treeError) {
        console.error('Error fetching folder tree:', treeError);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: '取得資料夾樹狀結構失敗', error_code: 'FETCH_ERROR' },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<FolderTreeNode[]>>(
        { success: true, data: treeData || [] },
        { status: 200 }
      );
    }

    // 一般查詢：取得所有資料夾（可選擇篩選父資料夾）
    let query = supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('level', { ascending: true })
      .order('name', { ascending: true });

    if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    const { data: folders, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching folders:', fetchError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '取得資料夾列表失敗', error_code: 'FETCH_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Folder[]>>(
      { success: true, data: folders || [] },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET /api/folders error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: '伺服器錯誤', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/folders
 * 新增資料夾
 * 
 * Body:
 * - name: string (資料夾名稱)
 * - parent_id: string | null (父資料夾 ID，null 表示根資料夾)
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
    const validationResult = createFolderSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || '資料驗證失敗';
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: errorMessage, error_code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { name, parent_id } = validationResult.data;

    // 計算新資料夾的層級
    let newLevel = 1; // 預設為根資料夾
    
    if (parent_id) {
      // 取得父資料夾資訊
      const { data: parentFolder, error: parentError } = await supabase
        .from('folders')
        .select('level')
        .eq('id', parent_id)
        .eq('user_id', user.id)
        .single();

      if (parentError || !parentFolder) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: FOLDER_VALIDATION_MESSAGES.PARENT_NOT_FOUND, error_code: 'PARENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      newLevel = parentFolder.level + 1;

      // 檢查層級限制
      if (newLevel > FOLDER_LEVELS.MAX) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: FOLDER_VALIDATION_MESSAGES.MAX_LEVEL_REACHED, error_code: 'MAX_LEVEL_REACHED' },
          { status: 400 }
        );
      }
    }

    // 檢查同名資料夾（同一父資料夾下不可重名）
    const { data: existingFolder, error: checkError } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .eq('parent_id', parent_id || null)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking duplicate folder:', checkError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '檢查資料夾名稱失敗', error_code: 'CHECK_ERROR' },
        { status: 500 }
      );
    }

    if (existingFolder) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: FOLDER_VALIDATION_MESSAGES.DUPLICATE_NAME, error_code: 'DUPLICATE_NAME' },
        { status: 409 }
      );
    }

    // 新增資料夾
    const { data: newFolder, error: insertError } = await supabase
      .from('folders')
      .insert({
        user_id: user.id,
        name,
        parent_id: parent_id || null,
        level: newLevel,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating folder:', insertError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '建立資料夾失敗', error_code: 'CREATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Folder>>(
      { success: true, data: newFolder },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/folders error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: '伺服器錯誤', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
