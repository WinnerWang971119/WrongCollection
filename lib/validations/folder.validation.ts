// ============================================
// Folder Validation Schemas - Zod 驗證規則
// 說明：用於前端和後端的資料驗證
// ============================================

import { z } from 'zod';
import { FOLDER_NAME_LENGTH, FOLDER_VALIDATION_MESSAGES } from '@/lib/constants/folder.constants';

/**
 * 資料夾名稱驗證規則
 * - 不可為空
 * - 長度限制：1-50 字元
 * - 不可包含特殊字元：/ \ : * ? " < > |
 */
const folderNameSchema = z
  .string()
  .min(FOLDER_NAME_LENGTH.MIN, FOLDER_VALIDATION_MESSAGES.NAME_TOO_SHORT)
  .max(FOLDER_NAME_LENGTH.MAX, FOLDER_VALIDATION_MESSAGES.NAME_TOO_LONG)
  .refine(
    (name) => !/[/\\:*?"<>|]/.test(name),
    FOLDER_VALIDATION_MESSAGES.NAME_INVALID_CHARS
  )
  .transform((name) => name.trim());

/**
 * UUID 驗證規則
 */
const uuidSchema = z.string().uuid('無效的 UUID 格式');

/**
 * 新增資料夾驗證 Schema
 */
export const createFolderSchema = z.object({
  name: folderNameSchema,
  parent_id: uuidSchema.optional().nullable(),
});

/**
 * 更新資料夾驗證 Schema
 */
export const updateFolderSchema = z.object({
  name: folderNameSchema,
});

/**
 * 刪除資料夾驗證 Schema
 */
export const deleteFolderSchema = z.object({
  id: uuidSchema,
  force: z.boolean().optional().default(false), // 是否強制刪除（包含子資料夾）
});

/**
 * 取得資料夾驗證 Schema（查詢參數）
 */
export const getFoldersQuerySchema = z.object({
  parent_id: uuidSchema.optional().nullable(),
  level: z.number().int().min(1).max(4).optional(),
  include_children: z.boolean().optional().default(false),
});

/**
 * 型別推導（供 TypeScript 使用）
 */
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type DeleteFolderInput = z.infer<typeof deleteFolderSchema>;
export type GetFoldersQuery = z.infer<typeof getFoldersQuerySchema>;
