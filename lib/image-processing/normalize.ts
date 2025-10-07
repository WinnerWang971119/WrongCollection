// ============================================
// Normalize - 極簡圖片優化
// 說明：只做溫和去噪和輕微銳化，保持原始質感
// ============================================

import { loadOpenCV } from './opencv-loader';

export async function normalizeImage(imageFile: File): Promise<Blob> {
  const cv = await loadOpenCV();
  const img = await loadImageElement(imageFile);
  const src = cv.imread(img);
  
  try {
    // 轉換為灰階
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    
    // === 白底黑字轉換流程（優化版 - 保持文字完整性） ===
    
    // Step 1: 溫和去噪（保留文字細節）
    const denoised = new cv.Mat();
    cv.GaussianBlur(gray, denoised, new cv.Size(3, 3), 0);
    
    // Step 2: 自適應二值化（白底黑字）
    const binary = new cv.Mat();
    cv.adaptiveThreshold(
      denoised,
      binary,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      19,  // 增大區塊（15 → 19）減少邊緣侵蝕
      6    // 降低常數（8 → 6）保留更多細節
    );
    
    // Step 3: 非常輕微的形態學處理（只去除極小雜點）
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1, 1));
    const cleaned = new cv.Mat();
    cv.morphologyEx(binary, cleaned, cv.MORPH_OPEN, kernel);  // OPEN 不會侵蝕邊緣
    
    // Step 4: 輕微銳化（讓文字更清晰但不過度）
    const sharpened = new cv.Mat();
    const sharpenKernel = cv.matFromArray(3, 3, cv.CV_32F, [
      0, -0.3, 0,
      -0.3, 2.2, -0.3,
      0, -0.3, 0
    ]);
    cv.filter2D(cleaned, sharpened, -1, sharpenKernel);
    
    // 轉回 RGBA 以便顯示
    const rgba = new cv.Mat();
    cv.cvtColor(sharpened, rgba, cv.COLOR_GRAY2RGBA, 0);
    
    // 輸出
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, rgba);
    const blob = await canvasToBlob(canvas);
    
    // 清理
    src.delete();
    gray.delete();
    denoised.delete();
    binary.delete();
    kernel.delete();
    cleaned.delete();
    sharpened.delete();
    sharpenKernel.delete();
    rgba.delete();
    
    return blob;
  } catch (error) {
    src.delete();
    throw error;
  }
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas to Blob failed'));
    }, 'image/png');
  });
}
