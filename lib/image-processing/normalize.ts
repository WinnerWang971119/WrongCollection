// ============================================
// Normalize - 白底黑字標準化 + 對比度增強
// 說明：自適應二值化、去噪、CLAHE 增強
// ============================================

import { loadOpenCV } from './opencv-loader';

export async function normalizeImage(imageFile: File): Promise<Blob> {
  const cv = await loadOpenCV();
  const img = await loadImageElement(imageFile);
  const src = cv.imread(img);
  
  try {
    // 轉灰階
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    
    // 自適應二值化
    const binary = new cv.Mat();
    cv.adaptiveThreshold(
      gray,
      binary,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11,
      2
    );
    
    // 去噪
    const denoised = new cv.Mat();
    cv.medianBlur(binary, denoised, 3);
    
    // 形態學閉運算（去小雜點）
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    cv.morphologyEx(denoised, denoised, cv.MORPH_CLOSE, kernel);
    
    // CLAHE 對比度增強
    const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
    const enhanced = new cv.Mat();
    clahe.apply(denoised, enhanced);
    
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, enhanced);
    const blob = await canvasToBlob(canvas);
    
    src.delete();
    gray.delete();
    binary.delete();
    denoised.delete();
    kernel.delete();
    enhanced.delete();
    
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
