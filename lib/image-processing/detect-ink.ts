/**
 * 自動檢測圖片中的筆跡（手寫答案）並生成遮罩
 * 
 * 演算法原理：
 * 1. 轉換為灰階
 * 2. 二值化（閾值檢測深色筆跡）
 * 3. 膨脹處理（連接斷開的筆畫）
 * 4. 移除小雜訊點
 * 5. 生成遮罩圖片（黑色=移除，白色=保留）
 */

import { loadOpenCV } from './opencv-loader';

export interface DetectInkOptions {
  /**
   * 二值化閾值（0-255）
   * 較低值：檢測淺色筆跡（如鉛筆）
   * 較高值：只檢測深色筆跡（如原子筆）
   * 預設：120（平衡鉛筆和原子筆）
   */
  threshold?: number;

  /**
   * 膨脹次數（連接斷開的筆畫）
   * 較高值：連接更多斷點，但可能誤判
   * 預設：2
   */
  dilateIterations?: number;

  /**
   * 最小筆跡面積（像素數）
   * 小於此面積的區域會被視為雜訊移除
   * 預設：50
   */
  minInkArea?: number;

  /**
   * 是否反轉遮罩（用於黑底白字的情況）
   * 預設：false
   */
  invertMask?: boolean;
}

export interface InkDetectionResult {
  /**
   * 遮罩圖片 Blob（黑色=移除，白色=保留）
   */
  maskBlob: Blob;

  /**
   * 遮罩圖片的 Data URL（可直接顯示）
   */
  maskDataUrl: string;

  /**
   * 檢測到的筆跡區域數量
   */
  inkRegionCount: number;

  /**
   * 檢測到的總筆跡面積（像素數）
   */
  totalInkArea: number;

  /**
   * 筆跡佔圖片的百分比（0-100）
   */
  inkPercentage: number;
}

/**
 * 自動檢測圖片中的筆跡
 */
export async function detectInk(
  imageFile: File,
  options: DetectInkOptions = {}
): Promise<InkDetectionResult> {
  const {
    threshold = 120, // 平衡鉛筆和原子筆
    dilateIterations = 2,
    minInkArea = 50,
    invertMask = false,
  } = options;

  console.log('🔍 開始檢測筆跡...', {
    threshold,
    dilateIterations,
    minInkArea,
    invertMask,
  });

  // 載入 OpenCV
  const cv = await loadOpenCV();

  // 讀取圖片
  const img = await createImageBitmap(imageFile);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  // 轉換為 OpenCV Mat
  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  const mask = new cv.Mat();

  try {
    // Step 1: 轉換為灰階
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    console.log('✅ Step 1: 轉換為灰階');

    // Step 2: 二值化（檢測深色筆跡）
    // THRESH_BINARY_INV: 深色區域變白（前景），淺色變黑（背景）
    cv.threshold(gray, mask, threshold, 255, cv.THRESH_BINARY_INV);
    console.log('✅ Step 2: 二值化檢測筆跡');

    // Step 3: 膨脹處理（連接斷開的筆畫）
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    cv.dilate(mask, mask, kernel, new cv.Point(-1, -1), dilateIterations);
    console.log('✅ Step 3: 膨脹處理（連接筆畫）');

    // Step 4: 移除小雜訊點（可選）
    if (minInkArea > 0) {
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let inkRegionCount = 0;
      let totalInkArea = 0;

      // 遍歷所有輪廓，移除面積過小的
      const cleanedMask = cv.Mat.zeros(mask.rows, mask.cols, cv.CV_8U);
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        if (area >= minInkArea) {
          // 保留這個區域
          cv.drawContours(cleanedMask, contours, i, new cv.Scalar(255), -1);
          inkRegionCount++;
          totalInkArea += area;
        }
        contour.delete();
      }

      // 替換 mask
      cleanedMask.copyTo(mask);

      console.log(`✅ Step 4: 移除雜訊（保留 ${inkRegionCount} 個筆跡區域）`);

      contours.delete();
      hierarchy.delete();
      cleanedMask.delete();
    } else {
      // 簡單統計
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let inkRegionCount = contours.size();
      let totalInkArea = 0;
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        totalInkArea += cv.contourArea(contour);
        contour.delete();
      }

      console.log(`✅ 檢測到 ${inkRegionCount} 個筆跡區域`);

      contours.delete();
      hierarchy.delete();
    }

    // Step 5: 反轉遮罩（如果需要）
    if (invertMask) {
      cv.bitwise_not(mask, mask);
      console.log('✅ Step 5: 反轉遮罩');
    }

    // Step 6: 輸出為 PNG
    cv.imshow(canvas, mask);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
    });

    // 生成 Data URL
    const maskDataUrl = canvas.toDataURL('image/png');

    // 統計資訊
    const totalPixels = mask.rows * mask.cols;
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let inkRegionCount = contours.size();
    let totalInkArea = 0;
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      totalInkArea += cv.contourArea(contour);
      contour.delete();
    }

    const inkPercentage = (totalInkArea / totalPixels) * 100;

    console.log('✅ 筆跡檢測完成', {
      inkRegionCount,
      totalInkArea,
      inkPercentage: inkPercentage.toFixed(2) + '%',
    });

    contours.delete();
    hierarchy.delete();

    return {
      maskBlob: blob,
      maskDataUrl,
      inkRegionCount,
      totalInkArea,
      inkPercentage,
    };
  } finally {
    src.delete();
    gray.delete();
    mask.delete();
  }
}

/**
 * 驗證檢測結果是否合理
 */
export function validateInkDetection(result: InkDetectionResult): {
  isValid: boolean;
  warning?: string;
} {
  // 檢查是否檢測到筆跡
  if (result.inkRegionCount === 0) {
    return {
      isValid: false,
      warning: '未檢測到筆跡，可能需要調整閾值',
    };
  }

  // 檢查筆跡面積是否過大（可能誤判為整張圖片）
  if (result.inkPercentage > 80) {
    return {
      isValid: false,
      warning: '檢測到的筆跡面積過大（>80%），可能誤判背景為筆跡',
    };
  }

  // 檢查筆跡面積是否過小（可能只是雜訊）
  if (result.inkPercentage < 0.5) {
    return {
      isValid: false,
      warning: '檢測到的筆跡面積過小（<0.5%），可能只是雜訊',
    };
  }

  return { isValid: true };
}
