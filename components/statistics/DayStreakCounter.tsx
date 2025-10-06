// ============================================
// DayStreakCounter Component - 連續複習天數計數器
// 說明：極簡設計，只顯示火焰和數字
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getReviewStreak, type ReviewStreak } from '@/lib/api/statistics.api';
import { Flame } from 'lucide-react';

export default function DayStreakCounter() {
  const [streak, setStreak] = useState<ReviewStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入連續天數
  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReviewStreak();
      setStreak(data);
    } catch (err) {
      console.error('載入連續天數失敗:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // 根據連續天數返回火焰顏色
  const getFlameColor = (days: number) => {
    if (days === 0) return 'text-gray-400';
    if (days < 7) return 'text-orange-500';
    if (days < 30) return 'text-red-500';
    return 'text-yellow-500';
  };

  if (loading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg">連續複習</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="animate-pulse text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg">連續複習</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-red-600">載入失敗：{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!streak) {
    return null;
  }

  const days = streak.current_streak;
  const hasStreak = days > 0;

  return (
    <Card className="h-[400px] shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-lg">連續複習</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-[300px] space-y-6">
        {/* 火焰圖標 - 只在有連續天數時顯示 */}
        {hasStreak && (
          <Flame 
            className={`h-20 w-20 ${getFlameColor(days)} ${days >= 7 ? 'animate-pulse' : ''}`}
            strokeWidth={1.5}
          />
        )}

        {/* 連續天數 */}
        <div className="text-center">
          <div className="text-6xl font-bold text-gray-900 mb-2">
            {days}
          </div>
          <div className="text-sm text-gray-500">
            天連續複習
          </div>
        </div>

        {/* 最長紀錄 - 如果存在且大於當前 */}
        {streak.longest_streak > days && (
          <div className="text-xs text-gray-400">
            最佳紀錄：{streak.longest_streak} 天
          </div>
        )}
      </CardContent>
    </Card>
  );
}
