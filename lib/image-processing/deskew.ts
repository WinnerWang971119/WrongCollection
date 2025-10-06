// ============================================
// Deskew - 透視校正演算法
// 說明：自動擺正傾斜、變形的照片
// ============================================

import { loadOpenCV } from './opencv-loader';

export async function deskewImage(imageFile: File): Promise<Blob> {
  const cv = await loadOpenCV();
  const img = await loadImageElement(imageFile);
  const src = cv.imread(img);
  
  try {
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    
    // 計算角度並旋轉
    const angle = computeSkewAngle(cv, gray);
    
    if (Math.abs(angle) > 0.5) {
      const center = new cv.Point(src.cols / 2, src.rows / 2);
      const M = cv.getRotationMatrix2D(center, angle, 1.0);
      cv.warpAffine(src, src, M, src.size());
      M.delete();
    }
    
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, src);
    const blob = await canvasToBlob(canvas);
    
    src.delete();
    gray.delete();
    return blob;
  } catch (error) {
    src.delete();
    throw error;
  }
}

function computeSkewAngle(cv: any, gray: any): number {
  const edges = new cv.Mat();
  cv.Canny(gray, edges, 50, 150);
  
  const lines = new cv.Mat();
  cv.HoughLines(edges, lines, 1, Math.PI / 180, 100);
  
  let angles: number[] = [];
  for (let i = 0; i < lines.rows; i++) {
    const theta = lines.data32F[i * 2 + 1];
    const angle = (theta * 180 / Math.PI) - 90;
    if (Math.abs(angle) < 45) angles.push(angle);
  }
  
  edges.delete();
  lines.delete();
  
  return angles.length > 0 ? angles.reduce((a, b) => a + b) / angles.length : 0;
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
