// ============================================
// AnalyticsDialog Component - 學習分析對話框
// 說明：完整的學習分析對話框（4 個 Tab + TimeRangeSelector）
// ============================================

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, PieChart, TrendingUp, Brain, Zap } from 'lucide-react';
import TimeRangeSelector from './TimeRangeSelector';
import QuestionDistribution from './QuestionDistribution';
import LearningProgress from './LearningProgress';
import EasinessTrend from './EasinessTrend';
import ReviewEfficiency from './ReviewEfficiency';
import { type TimeRange } from '@/lib/api/statistics.api';

interface AnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AnalyticsDialog({ open, onOpenChange }: AnalyticsDialogProps) {
  const [activeTab, setActiveTab] = useState<string>('distribution');
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              完整學習分析
            </DialogTitle>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="distribution" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">分布</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">進度</span>
            </TabsTrigger>
            <TabsTrigger value="easiness" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">強度</span>
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">效率</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="distribution" className="space-y-4">
              <QuestionDistribution />
            </TabsContent>

            <TabsContent value="progress" className="space-y-4">
              <LearningProgress timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="easiness" className="space-y-4">
              <EasinessTrend timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="efficiency" className="space-y-4">
              <ReviewEfficiency timeRange={timeRange} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
