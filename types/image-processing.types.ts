// ============================================
// Image Processing Types - 圖片處理型別定義
// ============================================

/**
 * 處理步驟類型
 */
export type ProcessingStep =
  | 'idle'           // 閒置
  | 'cropping'       // 智能裁切中
  | 'deskewing'      // 透視校正中
  | 'normalizing'    // 白底黑字標準化中
  | 'enhancing'      // 對比度增強中
  | 'removing-ink'   // AI 移除筆跡中（未來 Phase 2D-3）
  | 'ocr'            // OCR 文字辨識中（未來 Phase 2D-3）
  | 'completed'      // 完成
  | 'error';         // 錯誤

/**
 * 處理步驟資訊
 */
export interface StepInfo {
  id: ProcessingStep;
  label: string;
  description: string;
  icon: string; // Lucide icon name
}

/**
 * 處理進度
 */
export interface ProcessingProgress {
  currentStep: ProcessingStep;
  currentStepIndex: number; // 當前步驟索引（0-5）
  totalSteps: number;       // 總步驟數（6）
  percentage: number;       // 進度百分比（0-100）
  message: string;          // 當前訊息
}

/**
 * 處理結果
 */
export interface ProcessingResult {
  success: boolean;
  processedImage: Blob | null;      // 處理後的圖片
  processedImageUrl: string | null; // 處理後的圖片 URL（用於預覽）
  ocrText?: string;                 // OCR 識別的文字（Phase 2D-3）
  ocrConfidence?: number;           // OCR 信心度（0-1）（Phase 2D-3）
  error?: string;                   // 錯誤訊息
  duration: number;                 // 處理耗時（毫秒）
}

/**
 * OCR 結果（Phase 2D-3 使用）
 */
export interface OCRResult {
  text: string;              // 完整文字內容
  structuredText?: string;   // 保留段落結構的文字
  confidence: number;        // 信心度（0-1）
  language?: string;         // 偵測的語言
}

/**
 * 錯誤類型
 */
export type ProcessingErrorType =
  | 'opencv-load-failed'    // OpenCV 載入失敗
  | 'image-load-failed'     // 圖片載入失敗
  | 'processing-failed'     // 處理失敗
  | 'api-error'             // API 錯誤（Phase 2D-3）
  | 'network-error'         // 網路錯誤（Phase 2D-3）
  | 'timeout'               // 超時
  | 'unknown';              // 未知錯誤

/**
 * 處理錯誤
 */
export interface ProcessingError {
  type: ProcessingErrorType;
  message: string;
  step: ProcessingStep;
  originalError?: Error;
}

/**
 * 處理選項
 */
export interface ProcessingOptions {
  enableCrop: boolean;         // 啟用智能裁切
  enableDeskew: boolean;       // 啟用透視校正
  enableNormalize: boolean;    // 啟用白底黑字標準化
  enableEnhance: boolean;      // 啟用對比度增強
  enableInkRemoval?: boolean;  // 啟用 AI 移除筆跡（Phase 2D-3）
  enableOCR?: boolean;         // 啟用 OCR 文字辨識（Phase 2D-3）
}

/**
 * 預設處理選項（優化後 - 只保留基本處理）
 */
export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  enableCrop: false,        // ❌ 關閉裁切
  enableDeskew: false,      // ❌ 關閉透視校正（造成更歪）
  enableNormalize: true,    // ✅ 只做溫和的去噪和銳化
  enableEnhance: false,     // ❌ 關閉對比度增強
  enableInkRemoval: false,  // Phase 2D-3 啟用
  enableOCR: false,         // Phase 2D-3 啟用
};

/**
 * 處理步驟資訊列表
 */
export const PROCESSING_STEPS: StepInfo[] = [
  {
    id: 'cropping',
    label: '智能裁切',
    description: '自動框選題目區域',
    icon: 'Crop',
  },
  {
    id: 'deskewing',
    label: '透視校正',
    description: '自動擺正傾斜照片',
    icon: 'RotateCw',
  },
  {
    id: 'normalizing',
    label: '白底黑字',
    description: '去光差、統一格式',
    icon: 'Sun',
  },
  {
    id: 'enhancing',
    label: '對比度增強',
    description: '讓圖片更清晰',
    icon: 'Contrast',
  },
  {
    id: 'removing-ink',
    label: 'AI 移除筆跡',
    description: '自動清除手寫答案',
    icon: 'Eraser',
  },
  {
    id: 'ocr',
    label: 'OCR 辨識',
    description: '圖片轉文字',
    icon: 'FileText',
  },
];
