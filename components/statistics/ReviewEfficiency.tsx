// ============================================
// ReviewEfficiency Component - 複習效率統計
// 說明：4 個統計卡片顯示複習指標
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getReviewEfficiency,
  type ReviewEfficiency as ReviewEfficiencyStats,
  type TimeRange,
} from '@/lib/api/statistics.api';
import {
  CheckCircle,
  Target,
  Star,
  Trophy,
} from 'lucide-react';

interface ReviewEfficiencyProps {
  timeRange: TimeRange;
}

export default function ReviewEfficiency({ timeRange }: ReviewEfficiencyProps) {
  const [data, setData] = useState<ReviewEfficiencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入資料
  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getReviewEfficiency(timeRange);
      setData(result);
    } catch (err) {
      console.error('載入複習效率失敗:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-12 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600">載入失敗：{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">尚無複習資料</p>
      </div>
    );
  }

  // 計算平均品質顯示值
  const avgQualityDisplay = data.average_quality !== null 
    ? data.average_quality.toFixed(1) 
    : '--';

  // 計算正確率顯示值
  const accuracyDisplay = data.accuracy_rate !== null
    ? `${data.accuracy_rate.toFixed(1)}%`
    : '--';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 卡片 1: 總複習次數 */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            總複習次數
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {data.total_reviews}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            已完成的複習次數
          </p>
        </CardContent>
      </Card>

      {/* 卡片 2: 答對率 */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            答對率
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <Target className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {accuracyDisplay}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            回答正確的比例
          </p>
        </CardContent>
      </Card>

      {/* 卡片 3: 平均品質 */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            平均品質
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Star className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600">
            {avgQualityDisplay}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            回答品質分數 (0-5)
          </p>
        </CardContent>
      </Card>

      {/* 卡片 4: 已掌握題目 */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            已掌握題目
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-amber-600">
            {data.mastered_questions}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            已達到熟練狀態
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
