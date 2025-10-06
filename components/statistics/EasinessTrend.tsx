// ============================================
// EasinessTrend Component - 記憶強度分析
// 說明：面積圖顯示 easiness_factor 趨勢
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getEasinessTrend,
  type EasinessTrendDay,
  type TimeRange,
} from '@/lib/api/statistics.api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Brain } from 'lucide-react';

interface EasinessTrendProps {
  timeRange: TimeRange;
}

export default function EasinessTrend({ timeRange }: EasinessTrendProps) {
  const [data, setData] = useState<EasinessTrendDay[]>([]);
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
      const result = await getEasinessTrend(timeRange);
      setData(result);
    } catch (err) {
      console.error('載入記憶強度失敗:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-purple-600">
              平均 EF: {data.average_ef.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              範圍: {data.min_ef.toFixed(2)} ~ {data.max_ef.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              題數: {data.question_count} 題
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
          <CardTitle className="text-lg">記憶強度分析</CardTitle>
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
          <CardTitle className="text-lg">記憶強度分析</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-sm text-red-600">載入失敗：{error}</p>
        </CardContent>
      </Card>
    );
  }

  // 空資料狀態
  if (data.length === 0 || data.every((d) => d.question_count === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">記憶強度分析</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-sm">尚無記憶強度資料</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 計算平均 EF
  const avgEF = data
    .filter((d) => d.question_count > 0)
    .reduce((sum, d) => sum + d.average_ef, 0) / data.filter((d) => d.question_count > 0).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">記憶強度分析</CardTitle>
          <div className="text-xs text-gray-500">
            平均 EF: <span className="font-semibold text-purple-600">{avgEF.toFixed(2)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data as any} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEF" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
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
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              domain={[1.3, 2.5]}
              ticks={[1.3, 1.6, 1.9, 2.2, 2.5]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="average_ef"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEF)"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center text-xs text-gray-500">
          💡 EF 越高表示記憶越牢固（範圍: 1.3 - 2.5+）
        </div>
      </CardContent>
    </Card>
  );
}
