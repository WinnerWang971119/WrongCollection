// ============================================
// Step1BasicInfo - 錯題新增步驟 1：基本資訊
// ============================================

'use client';

import { Control, FieldErrors } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MultiImageUpload, type ImageFile } from '@/components/ui/multi-image-upload';
import type { CreateQuestionInput } from '@/types/question.types';

interface Step1BasicInfoProps {
  control: Control<CreateQuestionInput>;
  errors: FieldErrors<CreateQuestionInput>;
  questionImages: ImageFile[];
  onQuestionImagesChange: (images: ImageFile[]) => void;
}

export function Step1BasicInfo({ 
  control, 
  errors,
  questionImages,
  onQuestionImagesChange,
}: Step1BasicInfoProps) {
  return (
    <div className="space-y-4">
      {/* 標題 */}
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              標題 <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="例如：解二次方程式 x²+5x+6=0"
                {...field}
                className="bg-white"
              />
            </FormControl>
            <p className="text-xs text-gray-500">
              💡 簡短描述這題的主題，方便日後搜尋（1-100 字元）
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 題目照片上傳 */}
      <div className="space-y-2">
        <FormLabel className="flex items-center gap-1">
          📷 題目照片 <span className="text-gray-400">(選填，最多2張)</span>
        </FormLabel>
        <MultiImageUpload
          images={questionImages}
          onImagesChange={onQuestionImagesChange}
          maxImages={2}
          imageType="question"
          label="點擊或拖曳上傳題目圖片"
          helperText="支援 JPG, PNG, WEBP, HEIC 格式，圖片會自動壓縮並上傳"
        />
        {/* 顯示已上傳圖片數量 */}
        {questionImages.filter(img => img.uploaded).length > 0 && (
          <p className="text-xs text-green-600">
            ✓ 已成功上傳 {questionImages.filter(img => img.uploaded).length} 張圖片
          </p>
        )}
        {/* 顯示上傳中 */}
        {questionImages.some(img => img.uploading) && (
          <p className="text-xs text-blue-600 flex items-center gap-2">
            <span className="animate-spin">⏳</span> 上傳中...
          </p>
        )}
      </div>

      {/* 題目文字 */}
      <FormField
        control={control}
        name="question_text"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              ✏️ 題目內容 <span className="text-gray-400">(選填)</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="在此輸入題目內容...&#10;例如：求解二次方程式 x²+5x+6=0"
                {...field}
                value={field.value || ''}
                className="bg-white min-h-[120px] resize-none"
                rows={5}
              />
            </FormControl>
            <p className="text-xs text-gray-500">
              💡 可以輸入題目的文字內容，支援換行
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 提示：至少填一項 */}
      {errors.question_text && !questionImages.some(img => img.uploaded) && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-700">
          ⚠️ 題目照片或題目內容至少需要填寫一項
        </div>
      )}
    </div>
  );
}
