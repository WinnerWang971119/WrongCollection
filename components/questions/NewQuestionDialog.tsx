// ============================================
// NewQuestionDialog - 新增錯題對話框（3步驟）
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { createQuestion } from '@/lib/api/question.api';
import { createQuestionSchema } from '@/lib/validations/question.validation';
import type { CreateQuestionInput } from '@/types/question.types';
import type { ImageFile } from '@/components/ui/multi-image-upload';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2Answer } from './Step2Answer';
import { Step3Folders } from './Step3Folders';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface NewQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFolderId?: string; // 預設選中的資料夾（從資料夾內新增時使用）
  onSuccess?: () => void; // 成功回調
}

export function NewQuestionDialog({
  open,
  onOpenChange,
  defaultFolderId,
  onSuccess,
}: NewQuestionDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionImages, setQuestionImages] = useState<ImageFile[]>([]);
  const [explanationImages, setExplanationImages] = useState<ImageFile[]>([]);

  const form = useForm<CreateQuestionInput>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      title: '',
      question_images: [],
      question_text: '',
      my_answer: '',
      correct_answer: '',
      explanation: '',
      explanation_images: [],
      difficulty: 'medium',
      folder_ids: defaultFolderId ? [defaultFolderId] : [],
    },
  });

  // 自動同步圖片路徑到表單（重要！）
  useEffect(() => {
    const questionImagePaths = questionImages
      .filter((img) => img.uploaded && img.path)
      .map((img) => img.path!);
    
    console.log('🔄 同步題目圖片路徑到表單:', questionImagePaths);
    form.setValue('question_images', questionImagePaths);
  }, [questionImages, form]);

  useEffect(() => {
    const explanationImagePaths = explanationImages
      .filter((img) => img.uploaded && img.path)
      .map((img) => img.path!);
    
    console.log('🔄 同步詳解圖片路徑到表單:', explanationImagePaths);
    form.setValue('explanation_images', explanationImagePaths);
  }, [explanationImages, form]);

  // 步驟驗證邏輯
  const validateStep = async (step: number): Promise<boolean> => {
    let fields: (keyof CreateQuestionInput)[] = [];

    switch (step) {
      case 1:
        fields = ['title', 'question_images', 'question_text'];
        break;
      case 2:
        fields = ['my_answer', 'correct_answer', 'explanation', 'explanation_images', 'difficulty'];
        break;
      case 3:
        fields = ['folder_ids'];
        break;
    }

    // 表單驗證
    const result = await form.trigger(fields);
    
    console.log(`✅ Step ${step} 驗證結果:`, result);
    console.log(`📋 表單當前值:`, form.getValues());
    
    return result;
  };

  // 下一步
  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  // 上一步
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // 提交表單
  const onSubmit = async (data: CreateQuestionInput) => {
    try {
      setIsSubmitting(true);

      // Debug: 顯示提交的完整資料
      console.log('📸 提交資料:', {
        title: data.title,
        question_images: data.question_images,
        explanation_images: data.explanation_images,
        questionImagesState: questionImages,
        explanationImagesState: explanationImages,
      });

      // 檢查是否有圖片正在上傳
      const hasUploadingImages = questionImages.some(img => img.uploading) || 
                                 explanationImages.some(img => img.uploading);
      
      if (hasUploadingImages) {
        toast.error('請等待圖片上傳完成');
        setIsSubmitting(false);
        return;
      }

      // 表單資料已經包含圖片路徑（由 useEffect 自動同步）
      await createQuestion(data);
      
      toast.success('✅ 錯題新增成功！');
      onOpenChange(false);
      form.reset();
      setCurrentStep(1);
      setQuestionImages([]);
      setExplanationImages([]);
      onSuccess?.();
    } catch (error) {
      console.error('❌ 新增錯題失敗:', error);
      toast.error('❌ 新增失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 關閉對話框時重置狀態
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setCurrentStep(1);
      setQuestionImages([]);
      setExplanationImages([]);
    }
    onOpenChange(open);
  };

  // 步驟指示器
  const StepIndicator = () => {
    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                transition-all duration-200
                ${
                  step === currentStep
                    ? 'bg-blue-600 text-white scale-110'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {step < currentStep ? <Check className="h-4 w-4" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`
                  w-16 h-1 mx-1 transition-colors duration-200
                  ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // 步驟標題
  const stepTitles = {
    1: '基本資訊',
    2: '答案內容',
    3: '選擇資料夾',
  };

  const stepDescriptions = {
    1: '填寫題目標題和內容',
    2: '記錄你的答案、正確答案和詳解',
    3: '選擇要放入的資料夾（可多選）',
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">📝 新增錯題</DialogTitle>
          <DialogDescription>
            {stepDescriptions[currentStep as keyof typeof stepDescriptions]}
          </DialogDescription>
        </DialogHeader>

        <StepIndicator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 步驟內容 */}
            <div className="min-h-[300px]">
              {currentStep === 1 && (
                <Step1BasicInfo 
                  control={form.control} 
                  errors={form.formState.errors}
                  questionImages={questionImages}
                  onQuestionImagesChange={setQuestionImages}
                />
              )}
              {currentStep === 2 && (
                <Step2Answer 
                  control={form.control}
                  explanationImages={explanationImages}
                  onExplanationImagesChange={setExplanationImages}
                />
              )}
              {currentStep === 3 && (
                <Step3Folders
                  control={form.control}
                  setValue={form.setValue}
                  defaultFolderId={defaultFolderId}
                />
              )}
            </div>

            {/* 操作按鈕 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                步驟 {currentStep} / 3 - {stepTitles[currentStep as keyof typeof stepTitles]}
              </div>

              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    上一步
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button type="button" onClick={handleNext}>
                    下一步
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        新增中...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        完成新增
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
