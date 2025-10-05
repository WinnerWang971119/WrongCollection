// ============================================
// EditQuestionDialog - 編輯錯題對話框（3步驟）
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
import { getQuestionById, updateQuestion } from '@/lib/api/question.api';
import { updateQuestionSchema } from '@/lib/validations/question.validation';
import type { UpdateQuestionInput, QuestionWithFolders } from '@/types/question.types';
import type { ImageFile } from '@/components/ui/multi-image-upload';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2Answer } from './Step2Answer';
import { Step3Folders } from './Step3Folders';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { getImagePublicUrl } from '@/lib/supabase/storage';

interface EditQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string | null;
  onSuccess?: () => void;
}

export function EditQuestionDialog({
  open,
  onOpenChange,
  questionId,
  onSuccess,
}: EditQuestionDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questionImages, setQuestionImages] = useState<ImageFile[]>([]);
  const [explanationImages, setExplanationImages] = useState<ImageFile[]>([]);
  const [originalQuestion, setOriginalQuestion] = useState<QuestionWithFolders | null>(null);

  const form = useForm<UpdateQuestionInput>({
    resolver: zodResolver(updateQuestionSchema),
    defaultValues: {
      title: '',
      question_images: [],
      question_text: '',
      my_answer: '',
      correct_answer: '',
      explanation: '',
      explanation_images: [],
      difficulty: 'medium',
      folder_ids: [],
    },
  });

  // 載入錯題資料
  useEffect(() => {
    if (open && questionId) {
      loadQuestion();
    } else {
      resetForm();
    }
  }, [open, questionId]);

  const loadQuestion = async () => {
    if (!questionId) return;

    try {
      setIsLoading(true);
      const question = await getQuestionById(questionId);
      setOriginalQuestion(question);

      // 設定表單預設值
      form.reset({
        title: question.title,
        question_images: question.question_images || [],
        question_text: question.question_text || '',
        my_answer: question.my_answer,
        correct_answer: question.correct_answer,
        explanation: question.explanation || '',
        explanation_images: question.explanation_images || [],
        difficulty: question.difficulty,
        folder_ids: question.folders?.map(f => f.id) || [],
      });

      // 設定題目圖片（已上傳狀態）
      if (question.question_images && question.question_images.length > 0) {
        const existingQuestionImages: ImageFile[] = question.question_images.map((path, index) => ({
          id: `existing_question_${index}`,
          file: new File([], `existing_${index}`), // Placeholder file
          preview: getImagePublicUrl(path),
          path: path,
          uploaded: true,
          uploading: false,
        }));
        setQuestionImages(existingQuestionImages);
      }

      // 設定詳解圖片（已上傳狀態）
      if (question.explanation_images && question.explanation_images.length > 0) {
        const existingExplanationImages: ImageFile[] = question.explanation_images.map((path, index) => ({
          id: `existing_explanation_${index}`,
          file: new File([], `existing_${index}`), // Placeholder file
          preview: getImagePublicUrl(path),
          path: path,
          uploaded: true,
          uploading: false,
        }));
        setExplanationImages(existingExplanationImages);
      }
    } catch (error) {
      console.error('載入錯題資料失敗:', error);
      toast.error('載入失敗，請稍後再試');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

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
    let fields: (keyof UpdateQuestionInput)[] = [];

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

    const result = await form.trigger(fields);
    console.log(`✅ Step ${step} 驗證結果:`, result);
    
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
  const onSubmit = async (data: UpdateQuestionInput) => {
    if (!questionId) return;

    try {
      setIsSubmitting(true);

      console.log('📝 更新資料:', {
        questionId,
        title: data.title,
        question_images: data.question_images,
        explanation_images: data.explanation_images,
      });

      // 檢查是否有圖片正在上傳
      const hasUploadingImages = questionImages.some(img => img.uploading) || 
                                 explanationImages.some(img => img.uploading);
      
      if (hasUploadingImages) {
        toast.error('請等待圖片上傳完成');
        setIsSubmitting(false);
        return;
      }

      // 更新錯題
      await updateQuestion(questionId, data);
      
      toast.success('✅ 錯題更新成功！');
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('❌ 更新錯題失敗:', error);
      toast.error('❌ 更新失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置表單
  const resetForm = () => {
    form.reset();
    setCurrentStep(1);
    setQuestionImages([]);
    setExplanationImages([]);
    setOriginalQuestion(null);
  };

  // 關閉對話框時重置狀態
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
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
    1: '修改題目標題和內容',
    2: '修改你的答案、正確答案和詳解',
    3: '選擇要放入的資料夾（可多選）',
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">📝 編輯錯題</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">📝 編輯錯題</DialogTitle>
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
                  control={form.control as any} 
                  errors={form.formState.errors}
                  questionImages={questionImages}
                  onQuestionImagesChange={setQuestionImages}
                />
              )}
              {currentStep === 2 && (
                <Step2Answer 
                  control={form.control as any}
                  explanationImages={explanationImages}
                  onExplanationImagesChange={setExplanationImages}
                />
              )}
              {currentStep === 3 && (
                <Step3Folders
                  control={form.control as any}
                  setValue={form.setValue as any}
                  defaultFolderId={undefined}
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
                        更新中...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        完成更新
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
