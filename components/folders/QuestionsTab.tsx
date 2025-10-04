// ============================================
// QuestionsTab Component - 錯題本人 Tab
// 說明：顯示本資料夾的錯題（不含子資料夾）
// 備註：Phase 1D 將實作完整功能，目前為骨架版本
// ============================================

'use client';

import { FileText, Plus, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuestionsTabProps {
  folderId: string;
  folderName: string;
}

export function QuestionsTab({ folderId, folderName }: QuestionsTabProps) {
  // TODO: Phase 1D - 從 API 獲取錯題列表
  const questions: any[] = [];

  // 空狀態
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        {/* 操作按鈕 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              本資料夾錯題 (0)
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              只顯示「{folderName}」中的錯題，不含子資料夾
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              智能複習本層
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              新增錯題
            </Button>
          </div>
        </div>

        {/* 空狀態 */}
        <Card className="border-blue-100">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-blue-50 rounded-full p-6 mb-4">
              <FileText className="h-12 w-12 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              此資料夾還沒有錯題
            </h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
              點擊上方「新增錯題」按鈕，開始記錄第一道錯題
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              新增錯題
            </Button>
          </CardContent>
        </Card>

        {/* 提示卡片 */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500 rounded-lg p-2 flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-2">記錄錯題小技巧</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 記錄題目時，可以上傳圖片方便複習</li>
                  <li>• 詳細記錄你的答案和正確答案，對比學習更有效</li>
                  <li>• 寫下詳解或心得，幫助未來的自己快速理解</li>
                  <li>• 使用標籤功能，方便後續搜尋和分類</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // TODO: Phase 1D - 實作錯題列表顯示
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          本資料夾錯題 ({questions.length})
        </h3>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            智能複習本層
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            新增錯題
          </Button>
        </div>
      </div>
      {/* 錯題列表 */}
      <div className="space-y-4">
        {/* TODO: 實作錯題卡片 */}
      </div>
    </div>
  );
}
