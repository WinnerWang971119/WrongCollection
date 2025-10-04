// ============================================
// AllQuestionsTab Component - 全部錯題 Tab
// 說明：顯示本資料夾+所有子資料夾的錯題統計
// 備註：Phase 1D 將實作完整功能，目前為骨架版本
// ============================================

'use client';

import { Layers, Sparkles, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AllQuestionsTabProps {
  folderId: string;
  folderName: string;
}

export function AllQuestionsTab({ folderId, folderName }: AllQuestionsTabProps) {
  // TODO: Phase 1D - 從 API 獲取包含子資料夾的所有錯題
  const totalQuestions = 0;
  const questionsInCurrentFolder = 0;
  const questionsInSubfolders = 0;

  // 空狀態
  if (totalQuestions === 0) {
    return (
      <div className="space-y-6">
        {/* 統計標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              全部錯題 (包含子資料夾)
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              顯示「{folderName}」及所有子資料夾的錯題
            </p>
          </div>
          <Button
            variant="outline"
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
            disabled
          >
            <Sparkles className="h-4 w-4 mr-2" />
            智能複習全部
          </Button>
        </div>

        {/* 空狀態 */}
        <Card className="border-purple-100">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-purple-50 rounded-full p-6 mb-4">
              <Layers className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              此資料夾及子資料夾都沒有錯題
            </h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
              切換到「錯題本人」Tab，開始記錄第一道錯題
            </p>
          </CardContent>
        </Card>

        {/* 說明卡片 */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-purple-500 rounded-lg p-2 flex-shrink-0">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-2">關於「全部錯題」功能</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 此 Tab 會顯示本資料夾及所有子資料夾的錯題</li>
                  <li>• 可以按資料夾分組查看，了解各章節的錯題分布</li>
                  <li>• 支援排序和篩選，快速找到需要複習的題目</li>
                  <li>• 「智能複習全部」會涵蓋所有子資料夾的錯題</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // TODO: Phase 1D - 實作完整錯題顯示
  return (
    <div className="space-y-6">
      {/* 標題與操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            全部錯題 ({totalQuestions})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            本層 {questionsInCurrentFolder} 題，子層 {questionsInSubfolders} 題
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-gray-300"
          >
            <Filter className="h-4 w-4 mr-2" />
            篩選
          </Button>
          <Button
            variant="outline"
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            智能複習全部
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {totalQuestions}
            </div>
            <div className="text-sm text-gray-600">總題數</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">0</div>
            <div className="text-sm text-gray-600">已複習</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {totalQuestions}
            </div>
            <div className="text-sm text-gray-600">待複習</div>
          </CardContent>
        </Card>
      </div>

      {/* 錯題列表（按資料夾分組） */}
      <div className="space-y-4">
        {/* TODO: Phase 1D - 實作按資料夾分組的錯題列表 */}
      </div>
    </div>
  );
}
