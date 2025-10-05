/**
 * SM-2 間隔重複演算法（Spaced Repetition Algorithm）
 * 
 * 基於 SuperMemo-2 演算法，用於計算下次複習時間和難度係數
 * 
 * 核心概念：
 * - Easiness Factor (EF): 難度係數，範圍 1.3+，預設 2.5
 * - Repetitions: 連續答對次數
 * - Interval: 間隔天數
 * - Quality: 答題品質（1-4）
 * 
 * 參考資料：
 * - https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 * - https://github.com/ankitects/anki
 */

import type { Question } from '@/types/question.types';

/**
 * 品質評分（4 級制）
 * 對應 Anki 的按鈕
 */
export enum ReviewQuality {
  /** 1 - 完全不記得（Again） */
  AGAIN = 1,
  /** 2 - 記得但很困難（Hard） */
  HARD = 2,
  /** 3 - 記得且正常（Good） */
  GOOD = 3,
  /** 4 - 記得且很簡單（Easy） */
  EASY = 4,
}

/**
 * 複習狀態
 */
export enum ReviewState {
  /** 新題目，從未複習過 */
  NEW = 'new',
  /** 學習中，正在建立記憶 */
  LEARNING = 'learning',
  /** 複習中，定期複習 */
  REVIEW = 'review',
  /** 已精通，長期記憶 */
  MASTERED = 'mastered',
}

/**
 * SM-2 演算法結果
 */
export interface SM2Result {
  /** 新的難度係數 */
  easinessFactor: number;
  /** 新的連續答對次數 */
  repetitions: number;
  /** 新的間隔天數 */
  interval: number;
  /** 下次複習日期 */
  nextReviewDate: Date;
  /** 新的複習狀態 */
  reviewState: ReviewState;
}

/**
 * SM-2 演算法輸入參數
 */
export interface SM2Input {
  /** 當前難度係數 */
  easinessFactor: number;
  /** 當前連續答對次數 */
  repetitions: number;
  /** 當前間隔天數 */
  interval: number;
  /** 本次答題品質 */
  quality: ReviewQuality;
  /** 當前複習狀態 */
  reviewState: ReviewState;
}

/**
 * 計算新的難度係數（EF）
 * 
 * 公式：EF' = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
 * 
 * @param currentEF 當前難度係數
 * @param quality 答題品質（1-4）
 * @returns 新的難度係數（最小值 1.3）
 */
export function calculateEasinessFactor(
  currentEF: number,
  quality: ReviewQuality
): number {
  // SM-2 原始公式使用 0-5 評分，我們使用 1-4，需要映射
  // 1 (Again) -> 0
  // 2 (Hard)  -> 2
  // 3 (Good)  -> 4
  // 4 (Easy)  -> 5
  const mappedQuality = quality === 1 ? 0 : quality === 2 ? 2 : quality === 3 ? 4 : 5;
  
  const newEF = currentEF + (0.1 - (5 - mappedQuality) * (0.08 + (5 - mappedQuality) * 0.02));
  
  // EF 最小值為 1.3
  return Math.max(1.3, newEF);
}

/**
 * 計算新的間隔天數
 * 
 * 規則：
 * - 第 1 次：1 天
 * - 第 2 次：6 天
 * - 第 3 次以上：上次間隔 × EF
 * 
 * @param repetitions 連續答對次數
 * @param previousInterval 上次間隔天數
 * @param easinessFactor 難度係數
 * @returns 新的間隔天數
 */
export function calculateInterval(
  repetitions: number,
  previousInterval: number,
  easinessFactor: number
): number {
  if (repetitions === 1) {
    return 1; // 第一次：1 天
  } else if (repetitions === 2) {
    return 6; // 第二次：6 天
  } else {
    // 第三次以上：上次間隔 × EF，向上取整
    return Math.ceil(previousInterval * easinessFactor);
  }
}

/**
 * 判斷新的複習狀態
 * 
 * 狀態轉換規則：
 * - new -> learning: 第一次複習
 * - learning -> review: 連續答對 2 次以上
 * - review -> mastered: 間隔超過 21 天（3 週）
 * - 答錯（quality < 3）: 退回 learning
 * 
 * @param currentState 當前狀態
 * @param repetitions 連續答對次數
 * @param interval 間隔天數
 * @param quality 答題品質
 * @returns 新的複習狀態
 */
export function determineReviewState(
  currentState: ReviewState,
  repetitions: number,
  interval: number,
  quality: ReviewQuality
): ReviewState {
  // 答錯（quality < 3）：退回學習中
  if (quality < ReviewQuality.GOOD) {
    return ReviewState.LEARNING;
  }

  // 狀態晉升判斷
  switch (currentState) {
    case ReviewState.NEW:
      // 新題目 -> 學習中
      return ReviewState.LEARNING;

    case ReviewState.LEARNING:
      // 連續答對 2 次以上 -> 複習中
      if (repetitions >= 2) {
        return ReviewState.REVIEW;
      }
      return ReviewState.LEARNING;

    case ReviewState.REVIEW:
      // 間隔超過 21 天 -> 已精通
      if (interval > 21) {
        return ReviewState.MASTERED;
      }
      return ReviewState.REVIEW;

    case ReviewState.MASTERED:
      // 保持精通狀態
      return ReviewState.MASTERED;

    default:
      return ReviewState.NEW;
  }
}

/**
 * SM-2 演算法核心函數
 * 
 * 根據答題品質計算下次複習時間和相關參數
 * 
 * @param input SM-2 輸入參數
 * @returns SM-2 計算結果
 * 
 * @example
 * ```typescript
 * const result = calculateNextReview({
 *   easinessFactor: 2.5,
 *   repetitions: 0,
 *   interval: 1,
 *   quality: ReviewQuality.GOOD,
 *   reviewState: ReviewState.NEW,
 * });
 * 
 * console.log(result.nextReviewDate); // 明天
 * console.log(result.reviewState); // 'learning'
 * ```
 */
export function calculateNextReview(input: SM2Input): SM2Result {
  const { easinessFactor, repetitions, interval, quality, reviewState } = input;

  // 1. 計算新的難度係數（EF）
  const newEF = calculateEasinessFactor(easinessFactor, quality);

  // 2. 判斷是否答對（quality >= 3）
  const isCorrect = quality >= ReviewQuality.GOOD;

  // 3. 計算新的連續答對次數
  let newRepetitions: number;
  if (isCorrect) {
    newRepetitions = repetitions + 1;
  } else {
    // 答錯時重置為 0
    newRepetitions = 0;
  }

  // 4. 計算新的間隔天數
  let newInterval: number;
  if (isCorrect) {
    newInterval = calculateInterval(newRepetitions, interval, newEF);
  } else {
    // 答錯時間隔重置為 1 天
    newInterval = 1;
  }

  // 5. 判斷新的複習狀態
  const newReviewState = determineReviewState(
    reviewState,
    newRepetitions,
    newInterval,
    quality
  );

  // 6. 計算下次複習日期
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  // 設定為當天的 00:00:00，方便查詢
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    easinessFactor: newEF,
    repetitions: newRepetitions,
    interval: newInterval,
    nextReviewDate,
    reviewState: newReviewState,
  };
}

/**
 * 從 Question 物件計算下次複習
 * 
 * 便利函數，直接從 Question 物件提取參數
 * 
 * @param question 錯題物件
 * @param quality 本次答題品質
 * @returns SM-2 計算結果
 */
export function calculateNextReviewFromQuestion(
  question: Question,
  quality: ReviewQuality
): SM2Result {
  return calculateNextReview({
    easinessFactor: question.easiness_factor || 2.5,
    repetitions: question.repetitions || 0,
    interval: question.interval || 1,
    quality,
    reviewState: (question.review_state as ReviewState) || ReviewState.NEW,
  });
}

/**
 * 取得品質評分的顯示文字
 */
export function getQualityLabel(quality: ReviewQuality): string {
  switch (quality) {
    case ReviewQuality.AGAIN:
      return '再來一次';
    case ReviewQuality.HARD:
      return '困難';
    case ReviewQuality.GOOD:
      return '良好';
    case ReviewQuality.EASY:
      return '簡單';
    default:
      return '未知';
  }
}

/**
 * 取得品質評分的顏色
 */
export function getQualityColor(quality: ReviewQuality): string {
  switch (quality) {
    case ReviewQuality.AGAIN:
      return 'text-red-600 bg-red-50 hover:bg-red-100';
    case ReviewQuality.HARD:
      return 'text-orange-600 bg-orange-50 hover:bg-orange-100';
    case ReviewQuality.GOOD:
      return 'text-green-600 bg-green-50 hover:bg-green-100';
    case ReviewQuality.EASY:
      return 'text-blue-600 bg-blue-50 hover:bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-50 hover:bg-gray-100';
  }
}

/**
 * 取得狀態的顯示文字
 */
export function getStateLabel(state: ReviewState): string {
  switch (state) {
    case ReviewState.NEW:
      return '新題目';
    case ReviewState.LEARNING:
      return '學習中';
    case ReviewState.REVIEW:
      return '複習中';
    case ReviewState.MASTERED:
      return '已精通';
    default:
      return '未知';
  }
}

/**
 * 取得狀態的顏色
 */
export function getStateColor(state: ReviewState): string {
  switch (state) {
    case ReviewState.NEW:
      return 'bg-gray-100 text-gray-800';
    case ReviewState.LEARNING:
      return 'bg-yellow-100 text-yellow-800';
    case ReviewState.REVIEW:
      return 'bg-blue-100 text-blue-800';
    case ReviewState.MASTERED:
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
