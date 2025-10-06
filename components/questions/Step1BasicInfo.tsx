// ============================================
// Step1BasicInfo - 錯題新增步驟 1：基本資訊
// ============================================

'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { MultiImageUpload, type ImageFile } from '@/components/ui/multi-image-upload';
import { ImageProcessorDialog } from '@/components/image-processing';
import { Wand2 } from 'lucide-react';
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
  const [showProcessor, setShowProcessor] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSmartProcess = () => {
    // 取得使用者選擇的第一張圖
    const firstImage = questionImages[0];
    if (firstImage?.file) {
      setSelectedFile(firstImage.file);
      setShowProcessor(true);
    }
  };

  const handleProcessed = (processedBlob: Blob) => {
    // 將處理後的圖片替換原圖
    const newFile = new File([processedBlob], 'processed_' + selectedFile?.name || 'image.png', {
      type: 'image/png',
    });
    
    // 更新圖片列表（替換第一張）
    const newImages = [...questionImages];
    if (newImages[0]) {
      newImages[0] = {
        ...newImages[0],
        file: newFile,
        preview: URL.createObjectURL(processedBlob),
      };
      onQuestionImagesChange(newImages);
    }
  };

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
        <div className="flex items-center justify-between">
          <FormLabel className="flex items-center gap-1">
            📷 題目照片 <span className="text-gray-400">(選填，最多2張)</span>
          </FormLabel>
          
          {/* 智能處理按鈕 */}
          {questionImages.length > 0 && questionImages[0]?.uploaded && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSmartProcess}
              className="flex items-center gap-2"
            >
              <Wand2 className="h-4 w-4" />
              智能處理
            </Button>
          )}
        </div>
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

      {/* 智能處理對話框 */}
      <ImageProcessorDialog
        open={showProcessor}
        onOpenChange={setShowProcessor}
        imageFile={selectedFile}
        onProcessed={handleProcessed}
      />
    </div>
  );
}
