// ============================================
// DailyTrendChart Component - 30 天複習趨勢圖表
// 說明：使用 Recharts 顯示面積圖，展示複習數據趨勢
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getReviewStats, type DailyReviewStat } from '@/lib/api/statistics.api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function DailyTrendChart() {
  const [stats, setStats] = useState<DailyReviewStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入統計數據
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReviewStats(30);
      setStats(data);
    } catch (err) {
      console.error('載入複習統計失敗:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            {payload[0].payload.date}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600">
              總複習：{payload[0].value} 題
            </p>
            {payload[1] && (
              <p className="text-sm text-green-600">
                答對：{payload[1].value} 題
              </p>
            )}
            {payload[0].payload.average_quality > 0 && (
              <p className="text-sm text-purple-600">
                平均評分：{payload[0].payload.average_quality.toFixed(1)} / 5.0
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-red-600">載入失敗：{error}</p>
        </CardContent>
      </Card>
    );
  }

  // 如果沒有數據
  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            📊 30 天複習趨勢
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            <div className="text-center space-y-2">
              <p>尚無複習記錄</p>
              <p className="text-sm text-gray-400">開始複習後，這裡將顯示您的學習趨勢</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          📊 30 天複習趨勢
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={stats}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorCorrect" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                // 格式化日期：只顯示 MM/DD
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                if (value === 'total_reviews') return '總複習數';
                if (value === 'correct_reviews') return '答對數';
                return value;
              }}
            />
            <Area
              type="monotone"
              dataKey="total_reviews"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorTotal)"
              name="total_reviews"
            />
            <Area
              type="monotone"
              dataKey="correct_reviews"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorCorrect)"
              name="correct_reviews"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
