// ============================================
// FolderTree Component - 資料夾樹狀結構
// 說明：顯示完整的資料夾樹，支援選擇、展開/收合
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderItem } from './FolderItem';
import { getFolderTree } from '@/lib/api/folder.api';
import type { FolderTreeNode } from '@/types/folder.types';

interface FolderTreeProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onAddRootFolder: () => void;
  onAddSubfolder: (folder: FolderTreeNode) => void;
  onEditFolder: (folder: FolderTreeNode) => void;
  onDeleteFolder: (folder: FolderTreeNode) => void;
  refreshTrigger?: number; // 用於觸發重新載入
}

export function FolderTree({
  selectedFolderId,
  onSelectFolder,
  onAddRootFolder,
  onAddSubfolder,
  onEditFolder,
  onDeleteFolder,
  refreshTrigger = 0,
}: FolderTreeProps) {
  const [folders, setFolders] = useState<FolderTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入資料夾樹
  const loadFolders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getFolderTree();
      setFolders(data);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError(err instanceof Error ? err.message : '載入資料夾失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始載入和重新載入
  useEffect(() => {
    loadFolders();
  }, [refreshTrigger]);

  return (
    <div className="flex flex-col h-full">
      {/* 返回首頁按鈕 */}
      {selectedFolderId && (
        <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectFolder(null)}
            className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <Home className="h-4 w-4 mr-2" />
            返回首頁
          </Button>
        </div>
      )}

      {/* 標題列 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">資料夾</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadFolders}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onAddRootFolder}
            className="h-8 px-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            新增
          </Button>
        </div>
      </div>

      {/* 資料夾列表 */}
      <ScrollArea className="flex-1 px-2 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-600">載入中...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={loadFolders}>
              重試
            </Button>
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <p className="text-sm text-gray-500 mb-3">
              還沒有資料夾
            </p>
            <Button variant="outline" size="sm" onClick={onAddRootFolder}>
              <Plus className="h-4 w-4 mr-1" />
              建立第一個資料夾
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                isSelected={selectedFolderId === folder.id}
                onSelect={onSelectFolder}
                onAddSubfolder={onAddSubfolder}
                onEdit={onEditFolder}
                onDelete={onDeleteFolder}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 統計資訊 */}
      {!isLoading && folders.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600">
            共 {countFolders(folders)} 個資料夾
          </p>
        </div>
      )}
    </div>
  );
}

// 輔助函數：遞迴計算資料夾總數
function countFolders(folders: FolderTreeNode[]): number {
  return folders.reduce((total, folder) => {
    return total + 1 + (folder.children ? countFolders(folder.children) : 0);
  }, 0);
}
