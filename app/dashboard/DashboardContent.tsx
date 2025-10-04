// ============================================
// DashboardContent Component - Dashboard 主要內容
// 說明：Client Component，處理資料夾選擇和對話框狀態
// ============================================

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, FolderOpen } from 'lucide-react';
import {
  FolderTree,
  NewFolderDialog,
  EditFolderDialog,
  DeleteFolderDialog,
} from '@/components/folders';
import LogoutButton from './LogoutButton';
import type { FolderTreeNode } from '@/types/folder.types';

interface DashboardContentProps {
  userEmail: string;
}

export default function DashboardContent({ userEmail }: DashboardContentProps) {
  // 資料夾狀態
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 對話框狀態
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);

  // 新增子資料夾狀態
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [parentFolderName, setParentFolderName] = useState<string | null>(null);

  // 編輯/刪除的資料夾
  const [editingFolder, setEditingFolder] = useState<FolderTreeNode | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderTreeNode | null>(null);

  // 處理新增根資料夾
  const handleAddRootFolder = () => {
    setParentFolderId(null);
    setParentFolderName(null);
    setIsNewFolderOpen(true);
  };

  // 處理新增子資料夾
  const handleAddSubfolder = (parentId: string, parentName?: string) => {
    setParentFolderId(parentId);
    setParentFolderName(parentName || null);
    setIsNewFolderOpen(true);
  };

  // 處理編輯資料夾
  const handleEditFolder = (folder: FolderTreeNode) => {
    setEditingFolder(folder);
    setIsEditFolderOpen(true);
  };

  // 處理刪除資料夾
  const handleDeleteFolder = (folder: FolderTreeNode) => {
    setDeletingFolder(folder);
    setIsDeleteFolderOpen(true);
  };

  // 操作成功後重新載入
  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* 側邊欄 */}
      <aside className="w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col">
        <FolderTree
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onAddRootFolder={handleAddRootFolder}
          onAddSubfolder={(parentId) => {
            // 這裡需要找到父資料夾名稱，暫時先用 ID
            handleAddSubfolder(parentId);
          }}
          onEditFolder={handleEditFolder}
          onDeleteFolder={handleDeleteFolder}
          refreshTrigger={refreshTrigger}
        />
      </aside>

      {/* 主要內容區域 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 頂部導航列 */}
        <nav className="bg-white border-b border-blue-100 shadow-sm px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-blue-900">錯題收集</h1>
              {selectedFolderId && (
                <span className="text-sm text-gray-500">
                  / 資料夾詳情
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{userEmail}</span>
              <LogoutButton />
            </div>
          </div>
        </nav>

        {/* 內容區域 */}
        <div className="flex-1 overflow-auto p-6">
          {selectedFolderId ? (
            // 選中資料夾：顯示錯題列表
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">錯題列表</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    資料夾 ID: {selectedFolderId}
                  </p>
                </div>
                <Button
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新增錯題
                </Button>
              </div>

              {/* 空狀態 */}
              <Card className="border-blue-100">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">此資料夾還沒有錯題</p>
                  <p className="text-sm text-gray-400 mb-4">
                    點擊上方按鈕新增第一道錯題
                  </p>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    新增錯題
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            // 未選中資料夾：顯示歡迎頁面
            <div className="space-y-6">
              <Card className="border-blue-100">
                <CardHeader>
                  <CardTitle className="text-3xl text-blue-900">
                    歡迎使用錯題收集系統！👋
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    開始組織您的錯題，讓學習更有效率！
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 pt-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-500 rounded-lg p-2">
                          <FolderOpen className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-blue-900">建立資料夾</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        點擊左側「新增」按鈕建立資料夾，最多支援 4 層階層結構
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-indigo-500 rounded-lg p-2">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-indigo-900">新增錯題</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        選擇資料夾後，即可在其中新增錯題記錄
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 功能預覽 */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-blue-100">
                  <CardHeader>
                    <CardTitle className="text-blue-900">📁 資料夾管理</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      支援最多 4 層的階層結構，輕鬆組織您的錯題
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-2">✅ 已完成</p>
                  </CardContent>
                </Card>

                <Card className="border-blue-100">
                  <CardHeader>
                    <CardTitle className="text-blue-900">📝 錯題記錄</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      詳細記錄題目、答案、詳解，支援圖片上傳
                    </p>
                    <p className="text-xs text-gray-400 mt-2">即將推出</p>
                  </CardContent>
                </Card>

                <Card className="border-blue-100">
                  <CardHeader>
                    <CardTitle className="text-blue-900">🎯 智能練習</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      根據錯誤次數和複習時間，智能推薦練習題目
                    </p>
                    <p className="text-xs text-gray-400 mt-2">即將推出</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 對話框 */}
      <NewFolderDialog
        open={isNewFolderOpen}
        onOpenChange={setIsNewFolderOpen}
        parentId={parentFolderId}
        parentName={parentFolderName}
        onSuccess={handleSuccess}
      />

      <EditFolderDialog
        open={isEditFolderOpen}
        onOpenChange={setIsEditFolderOpen}
        folder={editingFolder}
        onSuccess={handleSuccess}
      />

      <DeleteFolderDialog
        open={isDeleteFolderOpen}
        onOpenChange={setIsDeleteFolderOpen}
        folder={deletingFolder}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
