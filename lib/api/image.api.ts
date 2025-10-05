// ============================================
// Image Upload API Client - 圖片上傳 API 客戶端函數
// ============================================

import type { ImageFile } from '@/components/ui/multi-image-upload';
import type { ImageType } from '@/lib/supabase/storage';
import { compressImage } from '@/lib/supabase/storage';

interface UploadResult {
  path: string;
  publicUrl: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  error_code?: string;
}

/**
 * 上傳單張圖片
 */
export async function uploadQuestionImage(
  file: File,
  type: ImageType,
  index: number,
  questionId?: string
): Promise<UploadResult> {
  try {
    // 先壓縮圖片（客戶端壓縮）
    const compressedFile = await compressImage(file);

    // 建立 FormData
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('type', type);
    formData.append('index', index.toString());
    if (questionId) {
      formData.append('questionId', questionId);
    }

    // 上傳
    const response = await fetch('/api/upload/question-image', {
      method: 'POST',
      body: formData,
    });

    const data: ApiResponse<UploadResult> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || '上傳失敗');
    }

    return data.data!;
  } catch (error) {
    console.error('上傳圖片失敗:', error);
    throw error;
  }
}

/**
 * 批量上傳圖片
 */
export async function uploadQuestionImages(
  images: ImageFile[],
  type: ImageType,
  questionId?: string
): Promise<{ path: string; publicUrl: string; id: string }[]> {
  const uploadPromises = images.map(async (image, index) => {
    const result = await uploadQuestionImage(image.file, type, index, questionId);
    return {
      ...result,
      id: image.id,
    };
  });

  return Promise.all(uploadPromises);
}

/**
 * 刪除單張圖片
 */
export async function deleteQuestionImage(path: string): Promise<void> {
  try {
    const response = await fetch('/api/upload/question-image', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    const data: ApiResponse<void> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || '刪除失敗');
    }
  } catch (error) {
    console.error('刪除圖片失敗:', error);
    throw error;
  }
}

/**
 * 批量刪除圖片
 */
export async function deleteQuestionImages(paths: string[]): Promise<void> {
  const deletePromises = paths.map((path) => deleteQuestionImage(path));
  await Promise.all(deletePromises);
}
