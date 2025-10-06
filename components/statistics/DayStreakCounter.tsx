// ============================================
// DayStreakCounter Component - 連續複習天數計數器
// 說明：顯示當前連續複習天數，包含火焰動畫和激勵文字
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getReviewStreak, type ReviewStreak } from '@/lib/api/statistics.api';
import { Flame, Trophy, Target } from 'lucide-react';

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

  // 根據連續天數返回樣式和文字
  const getStreakStyle = (days: number) => {
    if (days === 0) {
      return {
        gradient: 'from-gray-400 to-gray-500',
        text: '開始你的學習之旅！',
        icon: <Target className="h-12 w-12 text-white" />,
        textColor: 'text-gray-700',
      };
    } else if (days < 7) {
      return {
        gradient: 'from-orange-400 to-orange-600',
        text: '保持下去，你很棒！',
        icon: <Flame className="h-12 w-12 text-white animate-pulse" />,
        textColor: 'text-orange-700',
      };
    } else if (days < 30) {
      return {
        gradient: 'from-red-500 to-red-700',
        text: '太棒了，持續前進！',
        icon: <Flame className="h-12 w-12 text-white animate-bounce" />,
        textColor: 'text-red-700',
      };
    } else {
      return {
        gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
        text: '🎉 你是傳奇！',
        icon: <Trophy className="h-12 w-12 text-white animate-pulse" />,
        textColor: 'text-yellow-700',
      };
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-gray-400 rounded-full mx-auto"></div>
            <div className="h-8 bg-gray-400 rounded w-20 mx-auto"></div>
            <div className="h-4 bg-gray-400 rounded w-32 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-red-600">載入失敗</p>
        </CardContent>
      </Card>
    );
  }

  if (!streak) {
    return null;
  }

  const style = getStreakStyle(streak.current_streak);

  return (
    <Card className={`bg-gradient-to-br ${style.gradient} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
      <CardContent className="p-8">
        <div className="text-center space-y-4">
          {/* 圖標 */}
          <div className="flex justify-center">
            {style.icon}
          </div>

          {/* 當前連續天數 */}
          <div>
            <div className="text-5xl font-bold text-white mb-1">
              {streak.current_streak}
            </div>
            <div className="text-white/90 font-medium">
              天連續複習
            </div>
          </div>

          {/* 激勵文字 */}
          <p className="text-white/80 text-sm font-medium">
            {style.text}
          </p>

          {/* 最長紀錄 */}
          {streak.longest_streak > 0 && (
            <div className="pt-4 border-t border-white/20">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs">
                <Trophy className="h-4 w-4" />
                <span>最長紀錄：{streak.longest_streak} 天</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
