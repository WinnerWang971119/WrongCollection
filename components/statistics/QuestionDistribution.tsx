// ============================================
// QuestionDistribution Component - 錯題分布分析
// 說明：圓餅圖顯示錯題分布（按資料夾/難度/時間）
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getQuestionDistribution,
  type QuestionDistribution,
  type GroupByType,
} from '@/lib/api/statistics.api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FolderOpen, BarChart3, Clock } from 'lucide-react';

// 顏色方案
const COLORS = {
  folder: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#bfdbfe'],
  difficulty: ['#10b981', '#f59e0b', '#ef4444'], // 綠、橙、紅
  time: ['#3b82f6', '#60a5fa', '#93c5fd'], // 藍色系
};

export default function QuestionDistribution() {
  const [activeTab, setActiveTab] = useState<GroupByType>('folder');
  const [data, setData] = useState<QuestionDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入資料
  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const loadData = async (groupBy: GroupByType) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getQuestionDistribution(groupBy);
      setData(result);
    } catch (err) {
      console.error('載入錯題分布失敗:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">
            {payload[0].payload.category}
          </p>
          <p className="text-sm text-blue-600">
            {payload[0].value} 題 ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">錯題分布分析</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">錯題分布分析</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-sm text-red-600">載入失敗：{error}</p>
        </CardContent>
      </Card>
    );
  }

  // 空資料狀態
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">錯題分布分析</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-400">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-sm">尚無錯題資料</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">錯題分布分析</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GroupByType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="folder" className="text-xs">
              <FolderOpen className="h-3 w-3 mr-1" />
              資料夾
            </TabsTrigger>
            <TabsTrigger value="difficulty" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              難度
            </TabsTrigger>
            <TabsTrigger value="time" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              時間
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={data as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[activeTab][index % COLORS[activeTab].length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => `${entry.payload.category}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
