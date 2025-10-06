// ============================================
// Image Processing Pipeline - 圖片處理流程整合
// 說明：整合所有本地處理步驟，提供統一介面
// ============================================

import { smartCrop } from './crop';
import { deskewImage } from './deskew';
import { normalizeImage } from './normalize';
import type { ProcessingOptions, ProcessingResult, ProcessingStep } from '@/types/image-processing.types';

/**
 * 執行完整圖片處理流程
 * @param file 原始圖片檔案
 * @param options 處理選項
 * @param onProgress 進度回調
 * @returns 處理結果
 */
export async function processImage(
  file: File,
  options: ProcessingOptions,
  onProgress?: (step: ProcessingStep, progress: number) => void
): Promise<ProcessingResult> {
  const startTime = Date.now();
  let currentFile: File | Blob = file;

  try {
    // Step 1: 智能裁切
    if (options.enableCrop) {
      onProgress?.('cropping', 20);
      const cropped = await smartCrop(currentFile as File);
      currentFile = new File([cropped], 'cropped.png', { type: 'image/png' });
    }

    // Step 2: 透視校正
    if (options.enableDeskew) {
      onProgress?.('deskewing', 40);
      const deskewed = await deskewImage(currentFile as File);
      currentFile = new File([deskewed], 'deskewed.png', { type: 'image/png' });
    }

    // Step 3: 白底黑字標準化 + 對比度增強
    if (options.enableNormalize || options.enableEnhance) {
      onProgress?.('normalizing', 60);
      const normalized = await normalizeImage(currentFile as File);
      currentFile = normalized;
      onProgress?.('enhancing', 80);
    }

    // 完成
    onProgress?.('completed', 100);

    return {
      success: true,
      processedImage: currentFile,
      processedImageUrl: URL.createObjectURL(currentFile),
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error('❌ 圖片處理失敗:', error);
    return {
      success: false,
      processedImage: null,
      processedImageUrl: null,
      error: error instanceof Error ? error.message : '未知錯誤',
      duration: Date.now() - startTime,
    };
  }
}
