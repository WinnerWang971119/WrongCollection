// ============================================
// Step2Answer - 錯題新增步驟 2：答案與詳解
// ============================================

'use client';

import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MultiImageUpload, type ImageFile } from '@/components/ui/multi-image-upload';
import type { CreateQuestionInput } from '@/types/question.types';

interface Step2AnswerProps {
  control: Control<CreateQuestionInput>;
  explanationImages: ImageFile[];
  onExplanationImagesChange: (images: ImageFile[]) => void;
}

export function Step2Answer({ 
  control,
  explanationImages,
  onExplanationImagesChange,
}: Step2AnswerProps) {
  return (
    <div className="space-y-4">
      {/* 我的答案 */}
      <FormField
        control={control}
        name="my_answer"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              ❌ 我的答案 <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="輸入你當時的答案...&#10;例如：x = -2 或 x = -4"
                {...field}
                className="bg-white min-h-[100px] resize-none"
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 正確答案 */}
      <FormField
        control={control}
        name="correct_answer"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              ✅ 正確答案 <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="輸入正確的答案...&#10;例如：x = -2 或 x = -3"
                {...field}
                className="bg-white min-h-[100px] resize-none"
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 詳解 */}
      <FormField
        control={control}
        name="explanation"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              📖 詳解 <span className="text-gray-400">(選填)</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="輸入解題步驟或重點...&#10;例如：使用因式分解：&#10;x²+5x+6 = (x+2)(x+3) = 0&#10;所以 x = -2 或 x = -3"
                {...field}
                value={field.value || ''}
                className="bg-white min-h-[120px] resize-none"
                rows={5}
              />
            </FormControl>
            <p className="text-xs text-gray-500">
              💡 詳細的解釋能幫助你更好地複習
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 詳解圖片上傳 */}
      <div className="space-y-2">
        <FormLabel className="flex items-center gap-1">
          📷 詳解圖片 <span className="text-gray-400">(選填，最多2張)</span>
        </FormLabel>
        <MultiImageUpload
          images={explanationImages}
          onImagesChange={onExplanationImagesChange}
          maxImages={2}
          imageType="explanation"
          label="點擊或拖曳上傳詳解圖片"
          helperText="上傳老師的批改或詳細解答圖片，自動壓縮並上傳"
        />
        {/* 顯示已上傳圖片數量 */}
        {explanationImages.filter(img => img.uploaded).length > 0 && (
          <p className="text-xs text-green-600">
            ✓ 已成功上傳 {explanationImages.filter(img => img.uploaded).length} 張圖片
          </p>
        )}
        {/* 顯示上傳中 */}
        {explanationImages.some(img => img.uploading) && (
          <p className="text-xs text-blue-600 flex items-center gap-2">
            <span className="animate-spin">⏳</span> 上傳中...
          </p>
        )}
      </div>

      {/* 難度 */}
      <FormField
        control={control}
        name="difficulty"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              難度 <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="easy" />
                  <Label
                    htmlFor="easy"
                    className="font-normal cursor-pointer flex items-center gap-1"
                  >
                    <span className="text-green-600">⭐</span>
                    簡單
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label
                    htmlFor="medium"
                    className="font-normal cursor-pointer flex items-center gap-1"
                  >
                    <span className="text-yellow-600">⭐⭐</span>
                    中等
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="hard" />
                  <Label
                    htmlFor="hard"
                    className="font-normal cursor-pointer flex items-center gap-1"
                  >
                    <span className="text-red-600">⭐⭐⭐</span>
                    困難
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
