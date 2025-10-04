// ============================================
// FolderContent Component - 資料夾內容顯示
// 說明：選中資料夾後的 Tab 切換內容
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SubfoldersTab, QuestionsTab, AllQuestionsTab } from '@/components/folders';
import type { FolderTreeNode } from '@/types/folder.types';
import { getFolders } from '@/lib/api/folder.api';
import { FOLDER_LEVELS } from '@/lib/constants/folder.constants';

interface FolderContentProps {
  folderId: string;
  onSelectFolder: (folderId: string) => void;
  onAddSubfolder: (parentFolder: FolderTreeNode) => void;
  refreshTrigger?: number; // 新增：用於觸發刷新
}

export function FolderContent({
  folderId,
  onSelectFolder,
  onAddSubfolder,
  refreshTrigger = 0,
}: FolderContentProps) {
  const [currentFolder, setCurrentFolder] = useState<FolderTreeNode | null>(null);
  const [subfolders, setSubfolders] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subfolders');

  // 載入資料夾資訊
  useEffect(() => {
    async function loadFolderData() {
      try {
        setLoading(true);
        
        // 獲取包含子資料夾的完整樹
        const data = await getFolders({ include_children: true }) as FolderTreeNode[];
        
        if (data) {
          // 遞迴搜尋當前資料夾
          const findFolder = (folders: FolderTreeNode[]): FolderTreeNode | null => {
            for (const folder of folders) {
              if (folder.id === folderId) return folder;
              if (folder.children) {
                const found = findFolder(folder.children);
                if (found) return found;
              }
            }
            return null;
          };

          const folder = findFolder(data);
          if (folder) {
            setCurrentFolder(folder);
            setSubfolders(folder.children || []);
          }
        }
      } catch (error) {
        console.error('載入資料夾失敗:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFolderData();
  }, [folderId, refreshTrigger]); // 添加 refreshTrigger 到依賴

  if (loading || !currentFolder) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const canAddSubfolder = currentFolder.level < FOLDER_LEVELS.MAX;
  const subfolderCount = subfolders.length;
  const questionCount = 0; // TODO: Phase 1D - 從 API 獲取
  const allQuestionCount = 0; // TODO: Phase 1D - 從 API 獲取

  return (
    <div className="space-y-6">
      {/* 麵包屑導航 */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {/* TODO: Phase 1D - 實作完整麵包屑路徑 */}
        <span className="font-medium text-gray-800">{currentFolder.name}</span>
        <Badge variant="secondary">Level {currentFolder.level}</Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="subfolders" className="relative">
            子資料夾
            {subfolderCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {subfolderCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="questions" className="relative">
            錯題本人
            {questionCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {questionCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="relative">
            全部錯題
            {allQuestionCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {allQuestionCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 子資料夾 Tab */}
        <TabsContent value="subfolders">
          <SubfoldersTab
            subfolders={subfolders}
            onSelectFolder={onSelectFolder}
            onAddSubfolder={() => onAddSubfolder(currentFolder)}
            canAddSubfolder={canAddSubfolder}
          />
        </TabsContent>

        {/* 錯題本人 Tab */}
        <TabsContent value="questions">
          <QuestionsTab
            folderId={folderId}
            folderName={currentFolder.name}
          />
        </TabsContent>

        {/* 全部錯題 Tab */}
        <TabsContent value="all">
          <AllQuestionsTab
            folderId={folderId}
            folderName={currentFolder.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
