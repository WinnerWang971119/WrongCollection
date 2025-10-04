// ============================================
// FolderItem Component - 單個資料夾項目
// 說明：顯示單個資料夾，支援展開/收合、編輯、刪除
// ============================================

'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreVertical, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FOLDER_COLORS, FOLDER_LEVELS } from '@/lib/constants/folder.constants';
import type { FolderTreeNode } from '@/types/folder.types';
import { cn } from '@/lib/utils';

interface FolderItemProps {
  folder: FolderTreeNode;
  isSelected: boolean;
  onSelect: (folderId: string) => void;
  onAddSubfolder: (folder: FolderTreeNode) => void;
  onEdit: (folder: FolderTreeNode) => void;
  onDelete: (folder: FolderTreeNode) => void;
  level?: number;
}

export function FolderItem({
  folder,
  isSelected,
  onSelect,
  onAddSubfolder,
  onEdit,
  onDelete,
  level = 0,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;
  const canAddSubfolder = folder.level < FOLDER_LEVELS.MAX;

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

  return (
    <div className="select-none">
      {/* 資料夾項目 */}
      <div
        className={cn(
          'group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors cursor-pointer',
          isSelected && 'bg-blue-100 border border-blue-300'
        )}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {/* 展開/收合圖示 */}
        <div className="w-4 h-4 flex items-center justify-center">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="hover:bg-blue-200 rounded p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        {/* 資料夾圖示 */}
        <div className={cn('flex-shrink-0', getLevelColor(folder.level))}>
          {isExpanded ? (
            <FolderOpen className="w-5 h-5" />
          ) : (
            <Folder className="w-5 h-5" />
          )}
        </div>

        {/* 資料夾名稱 */}
        <span className="flex-1 text-sm font-medium text-gray-800 truncate">
          {folder.name}
        </span>

        {/* 層級標籤 */}
        <Badge variant="secondary" className="text-xs">
          L{folder.level}
        </Badge>

        {/* 操作選單 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canAddSubfolder && (
              <DropdownMenuItem
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onAddSubfolder(folder);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                新增子資料夾
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onEdit(folder);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              編輯
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onDelete(folder);
              }}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 子資料夾 */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              isSelected={isSelected}
              onSelect={onSelect}
              onAddSubfolder={onAddSubfolder}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
