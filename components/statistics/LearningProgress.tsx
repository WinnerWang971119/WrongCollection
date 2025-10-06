// ============================================
// LearningProgress Component - 學習進度追蹤
// 說明：折線圖顯示 new/learning/review/mastered 狀態變化
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getLearningProgress,
  type LearningProgressDay,
  type TimeRange,
} from '@/lib/api/statistics.api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface LearningProgressProps {
  timeRange: TimeRange;
}

export default function LearningProgress({ timeRange }: LearningProgressProps) {
  const [data, setData] = useState<LearningProgressDay[]>([]);
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
      const result = await getLearningProgress(timeRange);
      setData(result);
    } catch (err) {
      console.error('載入學習進度失敗:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">New: {payload[0].value} 題</p>
            <p className="text-xs text-orange-500">Learning: {payload[1].value} 題</p>
            <p className="text-xs text-blue-500">Review: {payload[2].value} 題</p>
            <p className="text-xs text-green-500">Mastered: {payload[3].value} 題</p>
            <p className="text-xs text-gray-700 font-semibold mt-2">
              總計: {payload[0].payload.total_count} 題
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">學習進度追蹤</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse w-full">
            <div className="h-[350px] bg-gray-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">學習進度追蹤</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-sm text-red-600">載入失敗：{error}</p>
        </CardContent>
      </Card>
    );
  }

  // 空資料狀態
  if (data.length === 0 || data.every((d) => d.total_count === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">學習進度追蹤</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-400">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-sm">尚無學習進度資料</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">學習進度追蹤</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data as any} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                const labels: { [key: string]: string } = {
                  new_count: 'New',
                  learning_count: 'Learning',
                  review_count: 'Review',
                  mastered_count: 'Mastered',
                };
                return labels[value] || value;
              }}
            />
            <Line
              type="monotone"
              dataKey="new_count"
              stroke="#9ca3af"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="learning_count"
              stroke="#fb923c"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="review_count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="mastered_count"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
