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
    
    // === 新方法：對比度增強 + 反色（不使用二值化，保留灰階細節） ===
    
    // Step 1: 非常輕微去噪（只去除極小雜點）
    const denoised = new cv.Mat();
    cv.medianBlur(gray, denoised, 3);  // 使用中值濾波，保留邊緣
    
    // Step 2: 直方圖均衡化（增強對比度）
    const equalized = new cv.Mat();
    cv.equalizeHist(denoised, equalized);
    
    // Step 3: 自動判斷是否需要反色（黑底變白底）
    // 計算平均亮度，如果背景較暗則反色
    const mean = cv.mean(equalized);
    const avgBrightness = mean[0];
    
    let processed = new cv.Mat();
    if (avgBrightness < 128) {
      // 背景較暗，需要反色（黑底→白底）
      cv.bitwise_not(equalized, processed);
      console.log('🔄 背景較暗，已反色');
    } else {
      // 背景已經較亮，不需反色
      equalized.copyTo(processed);
      console.log('✅ 背景較亮，維持原色');
    }
    
    // Step 4: 調整對比度和亮度（讓文字更清晰）
    const adjusted = new cv.Mat();
    processed.convertTo(adjusted, -1, 1.5, 20);  // alpha=1.5 (對比), beta=20 (亮度)
    
    // Step 5: 銳化（恢復清晰邊緣）
    const sharpened = new cv.Mat();
    const sharpenKernel = cv.matFromArray(3, 3, cv.CV_32F, [
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
    ]);
    cv.filter2D(adjusted, sharpened, -1, sharpenKernel);
    
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
    equalized.delete();
    processed.delete();
    adjusted.delete();
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
