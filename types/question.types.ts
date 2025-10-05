// ============================================
// Question Types - 錯題型別定義
// ============================================

/**
 * 難度等級
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * 錯題基本資料（對應資料庫 questions 表）
 */
export interface Question {
  id: string;
  user_id: string;
  
  // 步驟 1：基本資訊
  title: string;                      // 錯題標題（1-100 字元）
  question_text: string | null;       // 題目文字（選填）
  question_images: string[];          // 題目照片路徑陣列（最多2張）
  
  // 步驟 2：答案與詳解
  my_answer: string;                  // 我的答案
  correct_answer: string;             // 正確答案
  explanation: string | null;         // 詳解（選填）
  explanation_images: string[];       // 詳解照片路徑陣列（最多2張）
  difficulty: Difficulty;             // 難度
  
  // 學習數據
  wrong_count: number;                // 錯誤次數
  last_reviewed_at: string | null;    // 最後複習時間
  
  // SM-2 演算法欄位（Phase 2A）
  easiness_factor: number;            // 難度係數（1.3-2.5+，越高越簡單）
  repetitions: number;                // 連續答對次數
  interval: number;                   // 間隔天數
  review_state: 'new' | 'learning' | 'review' | 'mastered';  // 複習狀態
  next_review_date: string | null;    // 下次複習日期
  last_quality: number | null;        // 上次複習品質（1-4）
  total_reviews: number;              // 總複習次數
  correct_reviews: number;            // 正確複習次數（品質>=3）
  average_quality: number;            // 平均複習品質
  first_reviewed_at: string | null;   // 首次複習時間
  graduated_at: string | null;        // 畢業時間（精通）
  
  // 時間戳
  created_at: string;
  updated_at: string;
}

/**
 * 資料夾簡化資訊（用於錯題關聯）
 */
export interface QuestionFolder {
  id: string;
  name: string;
  level: number;
  path?: string;  // 完整路徑，例如：數學 > 代數 > 二次方程
}

/**
 * 錯題 + 所屬資料夾列表（用於詳情頁）
 */
export interface QuestionWithFolders extends Question {
  folders: QuestionFolder[];
}

/**
 * 錯題列表項目（用於列表預覽，不含完整詳情）
 */
export interface QuestionListItem {
  id: string;
  title: string;
  difficulty: Difficulty;
  wrong_count: number;
  last_reviewed_at: string | null;
  created_at: string;
}

/**
 * 新增錯題的輸入資料（步驟化表單）
 */
export interface CreateQuestionInput {
  // 步驟 1：基本資訊
  title: string;                           // 標題（必填，1-100 字元）
  question_text?: string | null;           // 題目文字（選填）
  question_images?: string[];              // 題目照片路徑陣列（選填，最多2張）
  
  // 步驟 2：答案與詳解
  my_answer: string;                       // 我的答案（必填）
  correct_answer: string;                  // 正確答案（必填）
  explanation?: string | null;             // 詳解（選填）
  explanation_images?: string[];           // 詳解照片路徑陣列（選填，最多2張）
  difficulty: Difficulty;                  // 難度（必填）
  
  // 步驟 3：選擇資料夾
  folder_ids: string[];                    // 資料夾 ID 列表（至少一個）
}

/**
 * 更新錯題的輸入資料
 */
export interface UpdateQuestionInput {
  title?: string;
  question_text?: string;
  question_images?: string[];
  my_answer?: string;
  correct_answer?: string;
  explanation?: string;
  explanation_images?: string[];
  difficulty?: Difficulty;
  folder_ids?: string[];              // 更新資料夾關聯
}

/**
 * 錯題查詢參數
 */
export interface QuestionQueryParams {
  folder_id?: string;                 // 按資料夾篩選
  include_subfolders?: boolean;       // 是否包含子資料夾
  difficulty?: Difficulty;            // 按難度篩選
  search?: string;                    // 標題搜尋
  limit?: number;                     // 每頁數量
  offset?: number;                    // 分頁偏移
}

/**
 * API 回應格式
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  error_code?: string;
}

/**
 * 錯題統計資料
 */
export interface QuestionStats {
  total: number;                      // 總錯題數
  by_difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  reviewed: number;                   // 已複習
  not_reviewed: number;               // 未複習
  this_week: number;                  // 本周新增
}

/**
 * 複習模式：錯題卡片狀態
 */
export interface ReviewCardState {
  question: Question;
  showAnswer: boolean;                // 是否顯示答案
  isMarkedCorrect: boolean;           // 是否標記為已掌握
}
