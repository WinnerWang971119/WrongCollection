// ============================================
// Supabase Storage 工具函數
// 功能：處理圖片上傳、刪除、壓縮、URL 生成
// ============================================

import imageCompression from 'browser-image-compression';
import { createBrowserClient } from '@supabase/ssr';

// 建立 Supabase 客戶端（Client Component 使用）
function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const BUCKET_NAME = 'question-images';
const MAX_FILE_SIZE_MB = 5;
const MAX_IMAGES_PER_TYPE = 2;

/**
 * 圖片類型
 */
export type ImageType = 'question' | 'explanation';

/**
 * 壓縮選項
 */
export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

/**
 * 上傳結果
 */
export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * 壓縮圖片
 */
export async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<File> {
  const defaultOptions: CompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const compressedFile = await imageCompression(file, finalOptions);
    console.log(
      `圖片壓縮成功: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(
        compressedFile.size /
        1024 /
        1024
      ).toFixed(2)}MB`
    );
    return compressedFile;
  } catch (error) {
    console.error('圖片壓縮失敗:', error);
    throw new Error('圖片壓縮失敗');
  }
}

/**
 * 驗證圖片檔案
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // 檢查檔案類型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支援的檔案格式，請上傳 JPG、PNG、WEBP 或 HEIC 格式',
    };
  }

  // 檢查檔案大小
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      valid: false,
      error: `檔案大小超過限制（${MAX_FILE_SIZE_MB}MB），請選擇較小的圖片`,
    };
  }

  return { valid: true };
}

/**
 * 生成圖片儲存路徑
 */
export function generateImagePath(
  userId: string,
  questionId: string,
  type: ImageType,
  index: number,
  extension: string
): string {
  const timestamp = Date.now();
  const typePrefix = type === 'explanation' ? 'exp_' : '';
  return `${userId}/${questionId}_${timestamp}_${typePrefix}${index}.${extension}`;
}

/**
 * 生成臨時圖片路徑（提交前使用）
 */
export function generateTempImagePath(
  userId: string,
  type: ImageType,
  index: number,
  extension: string
): string {
  const timestamp = Date.now();
  const typePrefix = type === 'explanation' ? 'exp_' : '';
  return `${userId}/temp_${timestamp}_${typePrefix}${index}.${extension}`;
}

/**
 * 上傳圖片到 Supabase Storage
 */
export async function uploadQuestionImage(
  file: File,
  userId: string,
  path: string,
  shouldCompress: boolean = true
): Promise<UploadResult> {
  const supabase = createClient();

  try {
    // 壓縮圖片
    const fileToUpload = shouldCompress ? await compressImage(file) : file;

    // 上傳到 Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, fileToUpload, {
        cacheControl: '3600',
        upsert: false, // 不覆蓋現有檔案
      });

    if (error) {
      console.error('上傳圖片失敗:', error);
      throw new Error(error.message);
    }

    // 取得 Public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('上傳圖片錯誤:', error);
    throw error;
  }
}

/**
 * 刪除圖片
 */
export async function deleteQuestionImage(path: string): Promise<void> {
  const supabase = createClient();

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('刪除圖片失敗:', error);
      throw new Error(error.message);
    }

    console.log(`圖片已刪除: ${path}`);
  } catch (error) {
    console.error('刪除圖片錯誤:', error);
    throw error;
  }
}

/**
 * 批量刪除圖片
 */
export async function deleteQuestionImages(paths: string[]): Promise<void> {
  const supabase = createClient();

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);

    if (error) {
      console.error('批量刪除圖片失敗:', error);
      throw new Error(error.message);
    }

    console.log(`已刪除 ${paths.length} 張圖片`);
  } catch (error) {
    console.error('批量刪除圖片錯誤:', error);
    throw error;
  }
}

/**
 * 取得圖片 Public URL
 */
export function getImagePublicUrl(path: string): string {
  const supabase = createClient();

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * 取得圖片 Public URL（帶轉換參數）
 */
export function getImagePublicUrlWithTransform(
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  const supabase = createClient();

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path, {
      transform: {
        width: options?.width,
        height: options?.height,
        quality: options?.quality || 80,
      },
    });

  return data.publicUrl;
}

/**
 * 重命名圖片路徑（從 temp 轉為正式路徑）
 */
export async function renameImagePath(
  oldPath: string,
  newPath: string
): Promise<void> {
  const supabase = createClient();

  try {
    const { error: moveError } = await supabase.storage
      .from(BUCKET_NAME)
      .move(oldPath, newPath);

    if (moveError) {
      console.error('重命名圖片失敗:', moveError);
      throw new Error(moveError.message);
    }

    console.log(`圖片已重命名: ${oldPath} → ${newPath}`);
  } catch (error) {
    console.error('重命名圖片錯誤:', error);
    throw error;
  }
}

/**
 * 取得檔案副檔名
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'jpg';
}

/**
 * 批量取得圖片 Public URLs
 */
export function getImagePublicUrls(paths: string[]): string[] {
  return paths.map((path) => getImagePublicUrl(path));
}

/**
 * 檢查是否為臨時路徑
 */
export function isTempPath(path: string): boolean {
  return path.includes('/temp_');
}
