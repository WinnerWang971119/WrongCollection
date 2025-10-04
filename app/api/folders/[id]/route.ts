// ============================================
// Folders API - PATCH (更新資料夾) & DELETE (刪除資料夾)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateFolderSchema } from '@/lib/validations/folder.validation';
import { FOLDER_VALIDATION_MESSAGES } from '@/lib/constants/folder.constants';
import type { Folder, ApiResponse } from '@/types/folder.types';

/**
 * PATCH /api/folders/[id]
 * 更新資料夾名稱
 * 
 * Body:
 * - name: string (新的資料夾名稱)
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

    const { id: folderId } = params;

    // 檢查資料夾是否存在且屬於該使用者
    const { data: existingFolder, error: fetchError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingFolder) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: FOLDER_VALIDATION_MESSAGES.FOLDER_NOT_FOUND, error_code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 解析請求資料
    const body = await request.json();
    
    // Zod 驗證
    const validationResult = updateFolderSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || '資料驗證失敗';
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: errorMessage, error_code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { name } = validationResult.data;

    // 檢查同名資料夾（同一父資料夾下不可重名）
    const { data: duplicateFolder, error: checkError } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .eq('parent_id', existingFolder.parent_id || null)
      .neq('id', folderId) // 排除自己
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking duplicate folder:', checkError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '檢查資料夾名稱失敗', error_code: 'CHECK_ERROR' },
        { status: 500 }
      );
    }

    if (duplicateFolder) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: FOLDER_VALIDATION_MESSAGES.DUPLICATE_NAME, error_code: 'DUPLICATE_NAME' },
        { status: 409 }
      );
    }

    // 更新資料夾
    const { data: updatedFolder, error: updateError } = await supabase
      .from('folders')
      .update({ name })
      .eq('id', folderId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating folder:', updateError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '更新資料夾失敗', error_code: 'UPDATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Folder>>(
      { success: true, data: updatedFolder },
      { status: 200 }
    );

  } catch (error) {
    console.error('PATCH /api/folders/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: '伺服器錯誤', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/folders/[id]
 * 刪除資料夾
 * 
 * Query Parameters:
 * - force: boolean (是否強制刪除，包含子資料夾，預設 false)
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

    const { id: folderId } = params;
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    // 檢查資料夾是否存在且屬於該使用者
    const { data: existingFolder, error: fetchError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingFolder) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: FOLDER_VALIDATION_MESSAGES.FOLDER_NOT_FOUND, error_code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 檢查是否有子資料夾
    const { data: hasSubfolders, error: checkError } = await supabase
      .rpc('has_subfolders', { p_folder_id: folderId });

    if (checkError) {
      console.error('Error checking subfolders:', checkError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '檢查子資料夾失敗', error_code: 'CHECK_ERROR' },
        { status: 500 }
      );
    }

    // 如果有子資料夾且不是強制刪除，則拒絕
    if (hasSubfolders && !force) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: FOLDER_VALIDATION_MESSAGES.HAS_SUBFOLDERS, error_code: 'HAS_SUBFOLDERS' },
        { status: 400 }
      );
    }

    // 如果強制刪除，先刪除所有子資料夾（遞迴刪除由資料庫 CASCADE 處理）
    // 刪除資料夾（CASCADE 會自動刪除子資料夾）
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting folder:', deleteError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: '刪除資料夾失敗', error_code: 'DELETE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { success: true, data: { id: folderId } },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE /api/folders/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: '伺服器錯誤', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
