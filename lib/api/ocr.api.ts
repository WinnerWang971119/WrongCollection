/**
 * OCR API 客戶端
 * 
 * 提供圖片文字辨識功能
 */

/**
 * OCR 辨識結果
 */
export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  language: string;
  characterCount: number;
  detectionCount: number;
  message?: string;
  error?: string;
  details?: string;
}

/**
 * 辨識圖片中的文字
 * 
 * @param image - 圖片檔案或 Blob
 * @returns OCR 辨識結果
 */
export async function extractTextFromImage(
  image: File | Blob
): Promise<OCRResult> {
  try {
    console.log('📤 上傳圖片進行 OCR 辨識...');

    const formData = new FormData();
    formData.append('image', image);

    const response = await fetch('/api/ocr/extract-text', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'OCR 處理失敗');
    }

    const result: OCRResult = await response.json();
    console.log('✅ OCR 辨識成功:', {
      textLength: result.text.length,
      confidence: result.confidence,
      language: result.language,
    });

    return result;

  } catch (error) {
    console.error('❌ OCR 辨識失敗:', error);
    throw error;
  }
}

/**
 * 格式化 OCR 結果（移除多餘空白、換行）
 * 
 * @param text - OCR 辨識的原始文字
 * @returns 格式化後的文字
 */
export function formatOCRText(text: string): string {
  return text
    .replace(/\n{3,}/g, '\n\n')  // 多個換行改為兩個
    .replace(/\s{2,}/g, ' ')      // 多個空格改為一個
    .trim();
}

/**
 * 判斷 OCR 結果品質
 * 
 * @param result - OCR 辨識結果
 * @returns 品質評估
 */
export function evaluateOCRQuality(result: OCRResult): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
} {
  const { confidence, characterCount } = result;

  if (confidence >= 0.9 && characterCount > 10) {
    return {
      quality: 'excellent',
      message: '✨ 辨識品質優秀！',
    };
  }

  if (confidence >= 0.7 && characterCount > 5) {
    return {
      quality: 'good',
      message: '✅ 辨識品質良好',
    };
  }

  if (confidence >= 0.5 && characterCount > 0) {
    return {
      quality: 'fair',
      message: '⚠️ 辨識品質普通，建議檢查',
    };
  }

  return {
    quality: 'poor',
    message: '❌ 辨識品質較差，建議重新拍攝',
  };
}
