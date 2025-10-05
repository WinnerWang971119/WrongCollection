// ============================================
// SubfoldersTab Component - 子資料夾 Tab
// 說明：顯示當前資料夾的所有子資料夾，卡片式布局
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Folder, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FolderTreeNode } from '@/types/folder.types';
import { FOLDER_COLORS } from '@/lib/constants/folder.constants';
import { cn } from '@/lib/utils';
import { getQuestions } from '@/lib/api/question.api';

interface SubfoldersTabProps {
  subfolders: FolderTreeNode[];
  onSelectFolder: (folderId: string) => void;
  onAddSubfolder: () => void;
  canAddSubfolder: boolean;
}

export function SubfoldersTab({
  subfolders,
  onSelectFolder,
  onAddSubfolder,
  canAddSubfolder,
}: SubfoldersTabProps) {
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  // 載入每個子資料夾的題數
  useEffect(() => {
    async function loadQuestionCounts() {
      const counts: Record<string, number> = {};
      
      // 對每個子資料夾查詢題數（包含其子資料夾）
      await Promise.all(
        subfolders.map(async (folder) => {
          try {
            const questions = await getQuestions({
              folder_id: folder.id,
              include_subfolders: true,
            });
            counts[folder.id] = questions.length;
          } catch (error) {
            console.error(`載入資料夾 ${folder.name} 的題數失敗:`, error);
            counts[folder.id] = 0;
          }
        })
      );
      
      setQuestionCounts(counts);
    }

    if (subfolders.length > 0) {
      loadQuestionCounts();
    }
  }, [subfolders]);
  // 根據層級選擇顏色
  const getLevelColor = (level: number) => {
    const colors = [
      FOLDER_COLORS.LEVEL_1,
      FOLDER_COLORS.LEVEL_2,
      FOLDER_COLORS.LEVEL_3,
      FOLDER_COLORS.LEVEL_4,
    ];
    return colors[level - 1] || FOLDER_COLORS.LEVEL_1;
  };

  // 空狀態
  if (subfolders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-gray-100 rounded-full p-6 mb-4">
          <Folder className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          此資料夾沒有子資料夾
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          {canAddSubfolder
            ? '點擊下方按鈕建立第一個子資料夾'
            : '此資料夾已達到最大層級 (Level 4)'}
        </p>
        {canAddSubfolder && (
          <Button
            onClick={onAddSubfolder}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Folder className="h-4 w-4 mr-2" />
            新增子資料夾
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 標題與新增按鈕 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            子資料夾 ({subfolders.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            點擊卡片進入子資料夾
          </p>
        </div>
        {canAddSubfolder && (
          <Button
            onClick={onAddSubfolder}
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <Folder className="h-4 w-4 mr-2" />
            新增子資料夾
          </Button>
        )}
      </div>

      {/* 子資料夾卡片網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subfolders.map((folder) => (
          <Card
            key={folder.id}
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-400"
            onClick={() => onSelectFolder(folder.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* 資料夾圖示 */}
                <div
                  className={cn(
                    'flex-shrink-0 p-3 rounded-lg bg-opacity-10',
                    getLevelColor(folder.level)
                  )}
                >
                  <Folder className={cn('h-6 w-6', getLevelColor(folder.level))} />
                </div>

                {/* 資料夾資訊 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                      {folder.name}
                    </h4>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      L{folder.level}
                    </Badge>
                  </div>

                  {/* 統計資訊 */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>
                      {questionCounts[folder.id] !== undefined
                        ? `${questionCounts[folder.id]} 題`
                        : '載入中...'}
                    </span>
                    {folder.children && folder.children.length > 0 && (
                      <span>{folder.children.length} 個子資料夾</span>
                    )}
                  </div>

                  {/* 進入按鈕 */}
                  <div className="flex items-center text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                    <span>進入</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
