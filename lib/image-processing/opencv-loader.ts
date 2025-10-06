// ============================================
// OpenCV Loader - OpenCV.js 動態載入器
// 說明：延遲載入 8MB 的 OpenCV.js，避免影響初始載入速度
// ============================================

import type { default as CV } from '@techstark/opencv-js';

let opencvInstance: typeof CV | null = null;
let loadingPromise: Promise<typeof CV> | null = null;

/**
 * 動態載入 OpenCV.js
 * @returns OpenCV 實例
 */
export async function loadOpenCV(): Promise<typeof CV> {
  // 如果已經載入，直接返回
  if (opencvInstance) {
    console.log('✅ OpenCV 已載入（使用快取）');
    return opencvInstance;
  }

  // 如果正在載入中，返回載入 Promise
  if (loadingPromise) {
    console.log('⏳ OpenCV 載入中...');
    return loadingPromise;
  }

  // 開始載入
  console.log('🚀 開始載入 OpenCV.js (~8MB)...');
  const startTime = Date.now();

  loadingPromise = (async () => {
    try {
      // 嘗試動態 import
      const cvModule = await import('@techstark/opencv-js');
      
      // @techstark/opencv-js 可能是 default export 或直接 export
      let cv = cvModule.default || cvModule;
      
      // 如果還是沒有 imread 方法，嘗試訪問 cv 屬性
      if (!cv.imread && (cvModule as any).cv) {
        cv = (cvModule as any).cv;
      }
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ OpenCV.js 載入完成！耗時：${loadTime}ms`);
      console.log('📦 OpenCV 方法檢查:', {
        hasImread: typeof cv.imread === 'function',
        hasCvtColor: typeof cv.cvtColor === 'function',
        keys: Object.keys(cv).slice(0, 10),
      });
      
      if (!cv.imread) {
        throw new Error('OpenCV imread 方法不存在，載入失敗');
      }
      
      opencvInstance = cv;
      return cv;
    } catch (error) {
      console.error('❌ OpenCV.js 載入失敗:', error);
      loadingPromise = null; // 重置，允許重試
      throw new Error('OpenCV.js 載入失敗，請檢查網路連線');
    }
  })();

  return loadingPromise;
}

/**
 * 檢查 OpenCV 是否已載入
 */
export function isOpenCVLoaded(): boolean {
  return opencvInstance !== null;
}

/**
 * 取得 OpenCV 實例（同步）
 * @throws {Error} 如果 OpenCV 尚未載入
 */
export function getOpenCV(): typeof CV {
  if (!opencvInstance) {
    throw new Error('OpenCV 尚未載入，請先呼叫 loadOpenCV()');
  }
  return opencvInstance;
}

/**
 * 清除 OpenCV 實例（用於測試）
 */
export function clearOpenCV(): void {
  opencvInstance = null;
  loadingPromise = null;
  console.log('🧹 OpenCV 實例已清除');
}

/**
 * Preload OpenCV（建議在應用啟動時呼叫）
 * 可以在使用者進入圖片處理功能前提前載入
 */
export function preloadOpenCV(): void {
  if (!opencvInstance && !loadingPromise) {
    console.log('📦 Preload OpenCV.js...');
    loadOpenCV().catch((error) => {
      console.warn('⚠️ Preload OpenCV 失敗:', error);
    });
  }
}
