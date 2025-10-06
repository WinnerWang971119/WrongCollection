// ============================================
// AnalyticsDialog Component - 學習分析對話框
// 說明：完整的學習分析對話框（預留給未來的進階圖表）
// ============================================

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BarChart3 } from 'lucide-react';

interface AnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AnalyticsDialog({ open, onOpenChange }: AnalyticsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            完整學習分析
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 預留區域：未來將顯示更多進階圖表 */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-12 text-center">
            <div className="space-y-4">
              <BarChart3 className="h-16 w-16 text-purple-400 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-700">
                進階分析功能即將推出
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                未來這裡將顯示：
              </p>
              <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600">
                <li>📊 錯題分布分析（資料夾、難度、時間）</li>
                <li>🎯 學習進度追蹤（掌握度曲線）</li>
                <li>📈 記憶強度分析（easiness factor 趨勢）</li>
                <li>🔥 複習效率統計（正確率、平均時間）</li>
              </ul>
              <p className="text-sm text-gray-500 pt-4">
                敬請期待 Phase 2C 更新！✨
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
