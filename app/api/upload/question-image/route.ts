// ============================================
// API Route: POST /api/upload/question-image
// 功能：處理圖片上傳、儲存到 Supabase Storage
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET_NAME = 'question-images';
const MAX_FILE_SIZE_MB = 5;

/**
 * POST /api/upload/question-image
 * 上傳圖片到 Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // 解析 FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'question' or 'explanation'
    const index = formData.get('index') as string;
    const questionId = formData.get('questionId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', error_code: 'NO_FILE' },
        { status: 400 }
      );
    }

    // 驗證檔案類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type', error_code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // 驗證檔案大小
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_SIZE_MB}MB)`, error_code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // 生成檔案路徑
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const typePrefix = type === 'explanation' ? 'exp_' : '';
    
    let path: string;
    if (questionId) {
      // 正式路徑（已有 question_id）
      path = `${user.id}/${questionId}_${timestamp}_${typePrefix}${index}.${extension}`;
    } else {
      // 臨時路徑（尚未建立 question）
      path = `${user.id}/temp_${timestamp}_${typePrefix}${index}.${extension}`;
    }

    // 轉換 File 為 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上傳到 Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('上傳圖片失敗:', error);
      return NextResponse.json(
        { error: 'Upload failed', error_code: 'UPLOAD_FAILED', details: error.message },
        { status: 500 }
      );
    }

    // 取得 Public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        publicUrl: urlData.publicUrl,
      },
    });
  } catch (error) {
    console.error('上傳圖片 API 錯誤:', error);
    return NextResponse.json(
      { error: 'Internal server error', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/question-image
 * 刪除圖片
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // 解析請求
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { error: 'No path provided', error_code: 'NO_PATH' },
        { status: 400 }
      );
    }

    // 檢查路徑是否屬於當前使用者
    if (!path.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: 'Forbidden', error_code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 刪除圖片
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('刪除圖片失敗:', error);
      return NextResponse.json(
        { error: 'Delete failed', error_code: 'DELETE_FAILED', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '圖片已刪除',
    });
  } catch (error) {
    console.error('刪除圖片 API 錯誤:', error);
    return NextResponse.json(
      { error: 'Internal server error', error_code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
