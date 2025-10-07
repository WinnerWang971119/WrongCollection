// ============================================
// Image Processor Dialog - 圖片處理主對話框
// 說明：管理整個處理流程的主對話框
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, X, Scissors } from 'lucide-react';
import ProcessingSteps from './ProcessingSteps';
import ImageCropper from './ImageCropper';
import { processImage } from '@/lib/image-processing/pipeline';
import { DEFAULT_PROCESSING_OPTIONS } from '@/types/image-processing.types';
import type { ProcessingStep, ProcessingResult } from '@/types/image-processing.types';
import { toast } from 'sonner';

interface ImageProcessorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onProcessed?: (processedBlob: Blob) => void;
}

export default function ImageProcessorDialog({
  open,
  onOpenChange,
  imageFile,
  onProcessed,
}: ImageProcessorDialogProps) {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  // 每次開啟對話框時重置狀態
  useEffect(() => {
    if (open) {
      setCurrentStep('idle');
      setProgress(0);
      setResult(null);
      setProcessing(false);
      setShowCropper(false);
      setCroppedBlob(null);
    }
  }, [open, imageFile]);

  const handleProcess = async () => {
    if (!imageFile) return;

    setProcessing(true);
    setCurrentStep('normalizing');
    setProgress(0);

    // 使用調整後的圖片（如果有），否則使用原圖
    const fileToProcess = croppedBlob 
      ? new File([croppedBlob], imageFile.name, { type: 'image/png' })
      : imageFile;

    const result = await processImage(
      fileToProcess,
      DEFAULT_PROCESSING_OPTIONS,
      (step, prog) => {
        setCurrentStep(step);
        setProgress(prog);
      }
    );

    setResult(result);
    setProcessing(false);

    if (result.success) {
      toast.success(`✅ 處理完成！耗時 ${(result.duration / 1000).toFixed(1)}s`);
    } else {
      toast.error('❌ 處理失敗：' + result.error);
    }
  };

  const handleUseProcessed = () => {
    if (result?.processedImage) {
      onProcessed?.(result.processedImage);
      onOpenChange(false);
      toast.success('✅ 已使用處理後的圖片');
    }
  };

  const handleDownload = () => {
    if (result?.processedImageUrl) {
      const a = document.createElement('a');
      a.href = result.processedImageUrl;
      a.download = 'processed_' + imageFile?.name || 'image.png';
      a.click();
      toast.success('⬇️ 下載成功');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎨 智能圖片處理
          </DialogTitle>
        </DialogHeader>

        {/* 調整模式（裁切 + 旋轉） */}
        {showCropper && imageFile && (
          <ImageCropper
            imageUrl={URL.createObjectURL(imageFile)}
            onCropComplete={(blob) => {
              setCroppedBlob(blob);
              setShowCropper(false);
              toast.success('✅ 調整完成！請點擊「開始處理」');
            }}
            onCancel={() => setShowCropper(false)}
          />
        )}

        {/* 正常模式 */}
        {!showCropper && (
          <div className="space-y-6">
            {/* 原圖預覽 */}
            {imageFile && !result && (
              <div className="space-y-2">
                <p className="text-sm font-medium">原始圖片</p>
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={croppedBlob ? URL.createObjectURL(croppedBlob) : URL.createObjectURL(imageFile)}
                    alt="原始圖片"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                </div>
                {croppedBlob && (
                  <p className="text-sm text-green-600">✓ 已調整</p>
                )}
              </div>
            )}

            {/* 步驟指示器 */}
            {processing && (
              <ProcessingSteps currentStep={currentStep} progress={progress} />
            )}

          {/* 處理結果預覽 */}
          {result?.success && result.processedImageUrl && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={result.processedImageUrl}
                  alt="處理後的圖片"
                  className="w-full h-auto"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleUseProcessed} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  使用此圖片
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  下載
                </Button>
              </div>
            </div>
          )}

          {/* 錯誤訊息 */}
          {result && !result.success && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              <p className="font-medium">處理失敗</p>
              <p className="text-sm">{result.error}</p>
              <Button onClick={handleProcess} variant="outline" className="mt-2">
                重試
              </Button>
            </div>
          )}

          {/* 開始處理按鈕 */}
          {!processing && !result && (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCropper(true)}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Scissors className="h-4 w-4" />
                {croppedBlob ? '重新調整' : '手動調整'}
              </Button>
              <Button
                onClick={handleProcess}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                🚀 {croppedBlob ? '處理調整後圖片' : '開始智能處理'}
              </Button>
            </div>
          )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
