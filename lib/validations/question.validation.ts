// ============================================
// Question Validation Schemas - 錯題驗證規則
// ============================================

import { z } from 'zod';

/**
 * 難度等級驗證
 */
export const difficultySchema = z.enum(['easy', 'medium', 'hard'], {
  message: '難度必須為「簡單」、「中等」或「困難」',
});

/**
 * 錯題標題驗證
 */
export const titleSchema = z
  .string({ message: '標題為必填欄位' })
  .min(1, '標題至少需要 1 個字元')
  .max(100, '標題最多 100 個字元')
  .trim();

/**
 * 題目文字驗證（選填）
 */
export const questionTextSchema = z
  .string()
  .max(5000, '題目內容最多 5000 個字元')
  .trim()
  .optional()
  .nullable();

/**
 * 題目照片路徑陣列驗證（選填，最多2張）
 */
export const questionImagesSchema = z
  .array(z.string().min(1, '圖片路徑不可為空'))
  .max(2, '最多只能上傳 2 張題目圖片')
  .optional()
  .default([]);

/**
 * 詳解照片路徑陣列驗證（選填，最多2張）
 */
export const explanationImagesSchema = z
  .array(z.string().min(1, '圖片路徑不可為空'))
  .max(2, '最多只能上傳 2 張詳解圖片')
  .optional()
  .default([]);

/**
 * 我的答案驗證
 */
export const myAnswerSchema = z
  .string({ message: '我的答案為必填欄位' })
  .min(1, '我的答案至少需要 1 個字元')
  .max(1000, '我的答案最多 1000 個字元')
  .trim();

/**
 * 正確答案驗證
 */
export const correctAnswerSchema = z
  .string({ message: '正確答案為必填欄位' })
  .min(1, '正確答案至少需要 1 個字元')
  .max(1000, '正確答案最多 1000 個字元')
  .trim();

/**
 * 詳解驗證（選填）
 */
export const explanationSchema = z
  .string()
  .max(2000, '詳解最多 2000 個字元')
  .trim()
  .optional()
  .nullable();

/**
 * 資料夾 ID 列表驗證
 */
export const folderIdsSchema = z
  .array(z.string().uuid('資料夾 ID 格式不正確'))
  .min(1, '至少需要選擇一個資料夾')
  .max(20, '最多只能選擇 20 個資料夾');

/**
 * 新增錯題 Schema（步驟化表單）
 */
export const createQuestionSchema = z
  .object({
    // 步驟 1：基本資訊
    title: titleSchema,
    question_text: questionTextSchema,
    question_images: questionImagesSchema,

    // 步驟 2：答案與詳解
    my_answer: myAnswerSchema,
    correct_answer: correctAnswerSchema,
    explanation: explanationSchema,
    explanation_images: explanationImagesSchema,
    difficulty: difficultySchema,

    // 步驟 3：選擇資料夾
    folder_ids: folderIdsSchema,
  })
  .refine(
    (data) => {
      // 照片或題目文字至少一個必填
      return data.question_text || (data.question_images && data.question_images.length > 0);
    },
    {
      message: '題目照片或題目文字至少需要填寫一項',
      path: ['question_text'], // 錯誤顯示在 question_text 欄位
    }
  );

/**
 * 更新錯題 Schema（所有欄位都是選填）
 */
export const updateQuestionSchema = z
  .object({
    title: titleSchema.optional(),
    question_text: questionTextSchema,
    question_images: questionImagesSchema,
    my_answer: myAnswerSchema.optional(),
    correct_answer: correctAnswerSchema.optional(),
    explanation: explanationSchema,
    explanation_images: explanationImagesSchema,
    difficulty: difficultySchema.optional(),
    folder_ids: folderIdsSchema.optional(),
  })
  .refine(
    (data) => {
      // 如果有提供 question_text 或 question_images，至少一個要有值
      const hasQuestionText = data.question_text !== undefined;
      const hasQuestionImages = data.question_images !== undefined;

      if (hasQuestionText || hasQuestionImages) {
        return data.question_text || (data.question_images && data.question_images.length > 0);
      }
      return true; // 如果都沒提供，跳過檢查
    },
    {
      message: '若要更新題目內容，照片或文字至少需要一項',
      path: ['question_text'],
    }
  );

/**
 * 錯題查詢參數 Schema
 */
export const questionQuerySchema = z.object({
  folder_id: z.string().uuid().optional(),
  include_subfolders: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  difficulty: difficultySchema.optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * 驗證訊息常數
 */
export const QUESTION_VALIDATION_MESSAGES = {
  TITLE_REQUIRED: '標題為必填欄位',
  TITLE_TOO_SHORT: '標題至少需要 1 個字元',
  TITLE_TOO_LONG: '標題最多 100 個字元',

  CONTENT_REQUIRED: '題目照片或題目文字至少需要填寫一項',
  CONTENT_TOO_LONG: '題目內容最多 5000 個字元',

  MY_ANSWER_REQUIRED: '我的答案為必填欄位',
  MY_ANSWER_TOO_LONG: '我的答案最多 1000 個字元',

  CORRECT_ANSWER_REQUIRED: '正確答案為必填欄位',
  CORRECT_ANSWER_TOO_LONG: '正確答案最多 1000 個字元',

  EXPLANATION_TOO_LONG: '詳解最多 2000 個字元',

  DIFFICULTY_INVALID: '難度必須為「簡單」、「中等」或「困難」',

  FOLDERS_REQUIRED: '至少需要選擇一個資料夾',
  FOLDERS_TOO_MANY: '最多只能選擇 20 個資料夾',

  QUESTION_NOT_FOUND: '找不到指定的錯題',
  UNAUTHORIZED: '無權限存取此錯題',
} as const;
