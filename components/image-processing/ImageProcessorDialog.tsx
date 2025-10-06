// ============================================
// Image Processor Dialog - 圖片處理主對話框
// 說明：管理整個處理流程的主對話框
// ============================================

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, X } from 'lucide-react';
import ProcessingSteps from './ProcessingSteps';
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

  const handleProcess = async () => {
    if (!imageFile) return;

    setProcessing(true);
    setCurrentStep('cropping');
    setProgress(0);

    const result = await processImage(
      imageFile,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎨 智能圖片處理
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
            <Button onClick={handleProcess} className="w-full" size="lg">
              🚀 開始智能處理
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
