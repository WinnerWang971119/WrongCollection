// ============================================
// TimeRangeSelector Component - 時間範圍選擇器
// 說明：提供 7/30/90/全部天數選擇
// ============================================

'use client';

import { TimeRange } from '@/lib/api/statistics.api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const options = [
    { value: 7 as TimeRange, label: '最近 7 天' },
    { value: 30 as TimeRange, label: '最近 30 天' },
    { value: 90 as TimeRange, label: '最近 90 天' },
    { value: 'all' as TimeRange, label: '全部' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <Select
        value={value.toString()}
        onValueChange={(val) => {
          const numVal = Number(val);
          onChange(isNaN(numVal) ? (val as TimeRange) : (numVal as TimeRange));
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="選擇時間範圍" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
