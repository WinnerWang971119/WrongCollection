// ============================================
// Smart Crop - 智能裁切演算法
// 說明：自動框選題目區域，去除背景
// ============================================

import { loadOpenCV } from './opencv-loader';

/**
 * 智能裁切圖片
 * @param imageFile 原始圖片檔案
 * @returns 裁切後的 Blob
 */
export async function smartCrop(imageFile: File): Promise<Blob> {
  const cv = await loadOpenCV();
  
  // 載入圖片
  const img = await loadImageElement(imageFile);
  const src = cv.imread(img);
  
  try {
    // 轉灰階
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    
    // 高斯模糊去噪
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    
    // Canny 邊緣檢測
    const edges = new cv.Mat();
    cv.Canny(blurred, edges, 50, 150);
    
    // 找輪廓
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    // 找最大矩形
    let maxArea = 0;
    let bestRect = new cv.Rect(0, 0, src.cols, src.rows);
    
    for (let i = 0; i < contours.size(); i++) {
      const rect = cv.boundingRect(contours.get(i));
      const area = rect.width * rect.height;
      
      // 過濾太小的區域（< 10% 面積）
      if (area > maxArea && area > src.cols * src.rows * 0.1) {
        maxArea = area;
        bestRect = rect;
      }
    }
    
    // 加邊距 10px
    const padding = 10;
    bestRect.x = Math.max(0, bestRect.x - padding);
    bestRect.y = Math.max(0, bestRect.y - padding);
    bestRect.width = Math.min(src.cols - bestRect.x, bestRect.width + padding * 2);
    bestRect.height = Math.min(src.rows - bestRect.y, bestRect.height + padding * 2);
    
    // 裁切
    const cropped = src.roi(bestRect);
    
    // 轉 Blob
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, cropped);
    const blob = await canvasToBlob(canvas);
    
    // 清理
    src.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
    cropped.delete();
    
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
