// ============================================
// Processing Steps - 處理步驟指示器
// 說明：顯示 6 個處理步驟和進度條
// ============================================

'use client';

import { Check, Loader2, Crop, RotateCw, Sun, Contrast } from 'lucide-react';
import type { ProcessingStep } from '@/types/image-processing.types';
import { Progress } from '@/components/ui/progress';

const STEPS = [
  { id: 'normalizing', label: '圖片優化', icon: Sun },
];

interface ProcessingStepsProps {
  currentStep: ProcessingStep;
  progress: number;
}

export default function ProcessingSteps({ currentStep, progress }: ProcessingStepsProps) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="space-y-4">
      <Progress value={progress} className="h-2" />
      
      <div className="grid grid-cols-1 gap-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentIndex > index;
          const isCurrent = currentStep === step.id;
          
          return (
            <div
              key={step.id}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                isCompleted ? 'bg-green-50 text-green-600' :
                isCurrent ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-500' :
                'bg-gray-50 text-gray-400'
              }`}
            >
              <div className="relative">
                {isCompleted ? (
                  <Check className="h-6 w-6" />
                ) : isCurrent ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </div>
              <span className="text-xs font-medium text-center">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
