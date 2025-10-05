// ============================================
// QuestionCard - 錯題列表卡片
// ============================================

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { QuestionListItem, QuestionWithFolders } from '@/types/question.types';
import { Edit, Trash2, Eye, Star } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionListItem | QuestionWithFolders;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showFolders?: boolean; // 是否顯示資料夾標籤
}

export function QuestionCard({
  question,
  onClick,
  onEdit,
  onDelete,
  showFolders = false,
}: QuestionCardProps) {
  // 難度星星數量
  const difficultyStars = {
    easy: 1,
    medium: 2,
    hard: 3,
  };

  // 難度顏色
  const difficultyColors = {
    easy: 'text-green-500',
    medium: 'text-yellow-500',
    hard: 'text-red-500',
  };

  // 難度文字
  const difficultyLabels = {
    easy: '簡單',
    medium: '中等',
    hard: '困難',
  };

  const starCount = difficultyStars[question.difficulty];
  const starColor = difficultyColors[question.difficulty];
  const difficultyLabel = difficultyLabels[question.difficulty];

  // 格式化時間
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '尚未複習';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '時間格式錯誤';
    }
  };

  // 檢查是否有資料夾資訊
  const hasFolder = 'folders' in question && question.folders;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 hover:border-blue-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* 標題與難度 */}
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={onClick}
              className="flex-1 text-left group"
              type="button"
            >
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {question.title}
              </h3>
            </button>

            {/* 難度星星 */}
            <div className="flex items-center gap-1 shrink-0">
              {Array.from({ length: starCount }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${starColor} fill-current`} />
              ))}
              <span className={`text-xs font-medium ml-1 ${starColor}`}>
                {difficultyLabel}
              </span>
            </div>
          </div>

          {/* 資料夾標籤 */}
          {showFolders && hasFolder && question.folders && question.folders.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {question.folders.map((folder) => (
                <Badge key={folder.id} variant="outline" className="text-xs">
                  📁 {folder.name}
                </Badge>
              ))}
            </div>
          )}

          {/* 統計資訊 */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-medium">錯誤次數:</span>
              <Badge variant="destructive" className="text-xs">
                {question.wrong_count}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-medium">最後複習:</span>
              <span className="text-xs">
                {formatDate(question.last_reviewed_at)}
              </span>
            </div>
          </div>

          {/* 創建時間 */}
          <div className="text-xs text-gray-400">
            創建於 {formatDate(question.created_at)}
          </div>

          {/* 操作按鈕 */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onClick}
              className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-400 active:scale-95 transition-all duration-150"
            >
              <Eye className="mr-2 h-4 w-4" />
              查看詳情
            </Button>

            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="hover:bg-gray-100 active:scale-95 transition-all duration-150"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all duration-150"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
