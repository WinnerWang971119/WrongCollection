'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Settings, Sparkles, FolderTree } from 'lucide-react';
import { toast } from 'sonner';
import { getFolders } from '@/lib/api/folder.api';
import { getCustomReviewQuestions } from '@/lib/api/question.api';
import type { FolderTreeNode } from '@/types/folder.types';

interface CustomReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartReview: (questions: any[]) => void;
}

export default function CustomReviewDialog({
  open,
  onOpenChange,
  onStartReview,
}: CustomReviewDialogProps) {
  // 狀態
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<FolderTreeNode[]>([]);
  const [previewCount, setPreviewCount] = useState<number>(0);

  // 篩選條件
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [daysSinceReview, setDaysSinceReview] = useState<number | undefined>(undefined);
  const [wrongCountRange, setWrongCountRange] = useState<[number, number]>([0, 20]);
  const [limit, setLimit] = useState<number>(50);

  // 載入資料夾
  useEffect(() => {
    if (open) {
      loadFolders();
    }
  }, [open]);

  // 自動預覽
  useEffect(() => {
    if (open) {
      previewQuestions();
    }
  }, [
    open,
    selectedFolders,
    selectedDifficulties,
    selectedStates,
    daysSinceReview,
    wrongCountRange,
    limit,
  ]);

  const loadFolders = async () => {
    try {
      const data = await getFolders({ include_children: true });
      setFolders(flattenFolders(data as FolderTreeNode[]));
    } catch (error) {
      console.error('載入資料夾失敗:', error);
    }
  };

  // 扁平化資料夾樹
  const flattenFolders = (folders: FolderTreeNode[]): FolderTreeNode[] => {
    const result: FolderTreeNode[] = [];
    const traverse = (items: FolderTreeNode[], level = 0) => {
      items.forEach(item => {
        result.push({ ...item, level });
        if (item.children && item.children.length > 0) {
          traverse(item.children, level + 1);
        }
      });
    };
    traverse(folders);
    return result;
  };

  // 預覽題目數量
  const previewQuestions = async () => {
    try {
      const questions = await getCustomReviewQuestions({
        folder_ids: selectedFolders.length > 0 ? selectedFolders : undefined,
        difficulties: selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
        review_states: selectedStates.length > 0 ? selectedStates : undefined,
        days_since_review: daysSinceReview,
        min_wrong_count: wrongCountRange[0],
        max_wrong_count: wrongCountRange[1],
        limit: 1000, // 預覽時不限制，取得總數
      });
      setPreviewCount(questions.length);
    } catch (error) {
      console.error('預覽失敗:', error);
      setPreviewCount(0);
    }
  };

  // 開始複習
  const handleStartReview = async () => {
    try {
      setLoading(true);

      const questions = await getCustomReviewQuestions({
        folder_ids: selectedFolders.length > 0 ? selectedFolders : undefined,
        difficulties: selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
        review_states: selectedStates.length > 0 ? selectedStates : undefined,
        days_since_review: daysSinceReview,
        min_wrong_count: wrongCountRange[0],
        max_wrong_count: wrongCountRange[1],
        limit,
      });

      if (questions.length === 0) {
        toast.info('📭 沒有符合條件的題目');
        return;
      }

      toast.success(`✅ 已載入 ${questions.length} 題`);
      onStartReview(questions);
      onOpenChange(false);
    } catch (error) {
      console.error('載入失敗:', error);
      toast.error('❌ 載入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 重置篩選
  const handleReset = () => {
    setSelectedFolders([]);
    setSelectedDifficulties([]);
    setSelectedStates([]);
    setDaysSinceReview(undefined);
    setWrongCountRange([0, 20]);
    setLimit(50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            自訂複習題目
          </DialogTitle>
          <DialogDescription>
            設定篩選條件，選擇要複習的題目
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 資料夾篩選 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              資料夾
            </Label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {folders.length === 0 ? (
                <p className="text-sm text-muted-foreground">載入中...</p>
              ) : (
                folders.map(folder => (
                  <div
                    key={folder.id}
                    className="flex items-center space-x-2"
                    style={{ paddingLeft: `${folder.level * 16}px` }}
                  >
                    <Checkbox
                      id={`folder-${folder.id}`}
                      checked={selectedFolders.includes(folder.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFolders([...selectedFolders, folder.id]);
                        } else {
                          setSelectedFolders(selectedFolders.filter(id => id !== folder.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={`folder-${folder.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {folder.name}
                    </label>
                  </div>
                ))
              )}
            </div>
            {selectedFolders.length > 0 && (
              <p className="text-sm text-muted-foreground">
                已選擇 {selectedFolders.length} 個資料夾
              </p>
            )}
          </div>

          {/* 難度篩選 */}
          <div className="space-y-2">
            <Label>難度</Label>
            <div className="flex gap-2">
              {['easy', 'medium', 'hard'].map(difficulty => (
                <Button
                  key={difficulty}
                  variant={selectedDifficulties.includes(difficulty) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (selectedDifficulties.includes(difficulty)) {
                      setSelectedDifficulties(selectedDifficulties.filter(d => d !== difficulty));
                    } else {
                      setSelectedDifficulties([...selectedDifficulties, difficulty]);
                    }
                  }}
                >
                  {difficulty === 'easy' && '⭐ 簡單'}
                  {difficulty === 'medium' && '⭐⭐ 中等'}
                  {difficulty === 'hard' && '⭐⭐⭐ 困難'}
                </Button>
              ))}
            </div>
          </div>

          {/* 複習狀態 */}
          <div className="space-y-2">
            <Label>複習狀態</Label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'new', label: '新題目', color: 'bg-blue-500' },
                { value: 'learning', label: '學習中', color: 'bg-yellow-500' },
                { value: 'review', label: '複習中', color: 'bg-green-500' },
                { value: 'mastered', label: '已精通', color: 'bg-purple-500' },
              ].map(state => (
                <Button
                  key={state.value}
                  variant={selectedStates.includes(state.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (selectedStates.includes(state.value)) {
                      setSelectedStates(selectedStates.filter(s => s !== state.value));
                    } else {
                      setSelectedStates([...selectedStates, state.value]);
                    }
                  }}
                >
                  <span className={`w-2 h-2 rounded-full ${state.color} mr-2`}></span>
                  {state.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 距離上次複習 */}
          <div className="space-y-2">
            <Label>距離上次複習</Label>
            <Select
              value={daysSinceReview?.toString() || 'all'}
              onValueChange={(value: string) => {
                setDaysSinceReview(value === 'all' ? undefined : parseInt(value));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇時間範圍" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="0">今天</SelectItem>
                <SelectItem value="3">3 天內</SelectItem>
                <SelectItem value="7">7 天內</SelectItem>
                <SelectItem value="14">14 天內</SelectItem>
                <SelectItem value="30">30 天內</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 錯誤次數範圍 */}
          <div className="space-y-2">
            <Label>錯誤次數範圍：{wrongCountRange[0]} - {wrongCountRange[1]}</Label>
            <Slider
              value={wrongCountRange}
              onValueChange={(value: number[]) => setWrongCountRange(value as [number, number])}
              min={0}
              max={20}
              step={1}
              className="w-full"
            />
          </div>

          {/* 題目數量限制 */}
          <div className="space-y-2">
            <Label>最多複習題數：{limit} 題</Label>
            <Select
              value={limit.toString()}
              onValueChange={(value: string) => setLimit(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 題</SelectItem>
                <SelectItem value="20">20 題</SelectItem>
                <SelectItem value="30">30 題</SelectItem>
                <SelectItem value="50">50 題</SelectItem>
                <SelectItem value="100">100 題</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 預覽 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">符合條件的題目</span>
              </div>
              <Badge variant="secondary" className="text-lg">
                {previewCount} 題
              </Badge>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              將複習 {Math.min(previewCount, limit)} 題（最多 {limit} 題）
            </p>
          </div>
        </div>

        {/* 按鈕 */}
        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading}
          >
            重置篩選
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              onClick={handleStartReview}
              disabled={loading || previewCount === 0}
            >
              {loading ? '載入中...' : `開始複習 (${Math.min(previewCount, limit)} 題)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
