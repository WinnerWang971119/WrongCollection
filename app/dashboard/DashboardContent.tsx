// ============================================
// DashboardContent Component - Dashboard 主要內容
// 說明：Client Component，處理資料夾選擇和對話框狀態
// ============================================

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3 } from 'lucide-react';
import {
  FolderTree,
  NewFolderDialog,
  EditFolderDialog,
  DeleteFolderDialog,
  FolderContent,
} from '@/components/folders';
import { NewQuestionDialog, ReviewQueue } from '@/components/questions';
import { DayStreakCounter, DailyTrendChart, AnalyticsDialog } from '@/components/statistics';
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
  const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
  const [showReviewQueue, setShowReviewQueue] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false); // 新增：學習分析對話框狀態

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
  const handleAddSubfolder = (parentFolder: FolderTreeNode) => {
    setParentFolderId(parentFolder.id);
    setParentFolderName(parentFolder.name);
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

  // 刪除成功後的回調
  const handleDeleteSuccess = () => {
    // 如果刪除的是當前選中的資料夾，則取消選中
    if (deletingFolder && selectedFolderId === deletingFolder.id) {
      setSelectedFolderId(null);
    }
    handleSuccess();
  };

  // 操作成功後重新載入
  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* 側邊欄 - 寬度調整為 400px */}
      <aside className="w-[400px] bg-white border-r border-gray-200 shadow-lg flex flex-col">
        <FolderTree
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onAddRootFolder={handleAddRootFolder}
          onAddSubfolder={handleAddSubfolder}
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
          {showReviewQueue ? (
            // 顯示複習佇列
            <div className="max-w-4xl mx-auto">
              <div className="mb-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowReviewQueue(false)}
                >
                  ← 返回主頁
                </Button>
              </div>
              <ReviewQueue onStartReview={() => {}} />
            </div>
          ) : selectedFolderId ? (
            // 選中資料夾：顯示 Tab 內容
            <FolderContent
              folderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onAddSubfolder={handleAddSubfolder}
              refreshTrigger={refreshTrigger}
            />
          ) : (
            // 未選中資料夾：顯示歡迎頁面
            <div className="max-w-6xl mx-auto space-y-8">
              {/* 歡迎標題 */}
              <div className="text-center space-y-3">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  歡迎回來！🎓
                </h2>
                <p className="text-gray-600 text-lg">
                  開始今天的學習之旅，讓錯題成為進步的階梯
                </p>
              </div>

              {/* 主功能卡片 */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* 功能1: 錯題登錄 */}
                <Card
                  className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-400 cursor-pointer"
                  onClick={() => setIsNewQuestionOpen(true)}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Plus className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          錯題登錄
                        </h3>
                        <p className="text-gray-600">
                          記錄新的錯題，包含題目、答案、詳解和圖片，讓每次錯誤都成為學習的機會
                        </p>
                        <div className="flex items-center gap-2 text-sm text-blue-600 font-medium pt-2">
                          <span>開始記錄</span>
                          <svg className="h-4 w-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 功能2: 智能複習 */}
                <Card 
                  className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-400 cursor-pointer"
                  onClick={() => setShowReviewQueue(true)}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1 space-y-3">
                        <h3 className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                          智能複習
                        </h3>
                        <p className="text-gray-600">
                          根據錯誤次數和時間間隔，系統智能推薦需要複習的題目，提高學習效率
                        </p>
                        <div className="flex items-center gap-2 text-sm text-purple-600 font-medium pt-2">
                          <span>開始複習</span>
                          <svg className="h-4 w-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 統計元件區域 */}
              <div className="space-y-6">
                {/* Grid 布局：DayStreakCounter 在左，DailyTrendChart 在右 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* DayStreakCounter - 佔 1 列 */}
                  <div className="lg:col-span-1">
                    <DayStreakCounter />
                  </div>
                  
                  {/* DailyTrendChart - 佔 2 列 */}
                  <div className="lg:col-span-2">
                    <DailyTrendChart />
                  </div>
                </div>

                {/* 學習分析按鈕 */}
                <div className="flex justify-center pt-4">
                  <Button
                    size="lg"
                    onClick={() => setShowAnalytics(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <BarChart3 className="mr-2 h-5 w-5" />
                    查看完整學習分析
                  </Button>
                </div>
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
        onSuccess={handleDeleteSuccess}
      />

      <NewQuestionDialog
        open={isNewQuestionOpen}
        onOpenChange={setIsNewQuestionOpen}
        onSuccess={handleSuccess}
      />

      <AnalyticsDialog
        open={showAnalytics}
        onOpenChange={setShowAnalytics}
      />
    </div>
  );
}
