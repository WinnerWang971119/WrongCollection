/**
 * AI 圖片處理 API 客戶端
 */

export interface RemoveInkRequest {
  /**
   * 原始圖片（base64 data URL）
   */
  image: string;

  /**
   * 遮罩圖片（base64 data URL）
   * 黑色區域 = 移除，白色區域 = 保留
   */
  mask: string;
}

export interface RemoveInkResponse {
  success: boolean;
  resultUrl: string;
  processingTime: number;
  message: string;
}

/**
 * 呼叫 AI 移除筆跡
 */
export async function removeInkWithAI(
  imageDataUrl: string,
  maskDataUrl: string
): Promise<string> {
  console.log('🧹 呼叫 AI 移除筆跡 API...');

  const response = await fetch('/api/ai/remove-ink', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageDataUrl,
      mask: maskDataUrl,
    } as RemoveInkRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '未知錯誤' }));
    const errorMessage = error.error || error.details || '移除筆跡失敗';
    
    console.error('❌ API 錯誤回應:', {
      status: response.status,
      statusText: response.statusText,
      error: error,
      fullError: JSON.stringify(error, null, 2),
    });
    
    // 顯示更詳細的錯誤訊息
    const detailedMessage = [
      `[${response.status}]`,
      errorMessage,
      error.details ? `\n詳情: ${error.details}` : '',
      error.logId ? `\nLog ID: ${error.logId}` : '',
      error.authError ? `\n認證錯誤: ${error.authError}` : '',
    ].filter(Boolean).join(' ');
    
    throw new Error(detailedMessage);
  }

  const data: RemoveInkResponse = await response.json();
  console.log(`✅ AI 移除筆跡成功 (${data.processingTime}ms)`);

  return data.resultUrl;
}

/**
 * 將 Replicate 結果 URL 轉換為 Blob（用於下載或進一步處理）
 */
export async function fetchImageAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('無法下載圖片');
  }
  return response.blob();
}

/**
 * 將 Blob 轉換為 Data URL
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 將 File 轉換為 Data URL
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return blobToDataUrl(file);
}
