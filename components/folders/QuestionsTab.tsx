// ============================================
// QuestionsTab Component - 錯題本人 Tab
// 說明：顯示本資料夾的錯題（不含子資料夾）
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getQuestions, deleteQuestion } from '@/lib/api/question.api';
import { QuestionCard, NewQuestionDialog, QuestionDetailDialog } from '@/components/questions';
import type { QuestionListItem } from '@/types/question.types';

interface QuestionsTabProps {
  folderId: string;
  folderName: string;
  refreshTrigger?: number;
}

export function QuestionsTab({ folderId, folderName, refreshTrigger = 0 }: QuestionsTabProps) {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // 載入錯題列表
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await getQuestions({
        folder_id: folderId,
        include_subfolders: false, // 只顯示本資料夾
      });
      setQuestions(data);
    } catch (error) {
      console.error('載入錯題失敗:', error);
      toast.error('❌ 載入錯題失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始載入和 refreshTrigger 變化時重新載入
  useEffect(() => {
    loadQuestions();
  }, [folderId, refreshTrigger]);

  // 刪除錯題
  const handleDelete = async (questionId: string) => {
    if (!confirm('確定要刪除這個錯題嗎？此操作無法復原。')) {
      return;
    }

    try {
      await deleteQuestion(questionId);
      toast.success('✅ 錯題已刪除');
      loadQuestions(); // 重新載入列表
    } catch (error) {
      console.error('刪除錯題失敗:', error);
      toast.error('❌ 刪除失敗');
    }
  };

  // 新增成功回調
  const handleNewSuccess = () => {
    loadQuestions(); // 重新載入列表
  };

  // 載入中狀態
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 空狀態
  if (questions.length === 0) {
    return (
      <>
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
                disabled
              >
                <Sparkles className="h-4 w-4 mr-2" />
                智能複習本層
              </Button>
              <Button
                onClick={() => setShowNewDialog(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
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
                onClick={() => setShowNewDialog(true)}
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
                    <li>• 記錄題目時，可以填寫圖片 URL 方便複習</li>
                    <li>• 詳細記錄你的答案和正確答案，對比學習更有效</li>
                    <li>• 寫下詳解或心得，幫助未來的自己快速理解</li>
                    <li>• 同一題可以加入多個資料夾，方便不同角度複習</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 新增錯題對話框 */}
        <NewQuestionDialog
          open={showNewDialog}
          onOpenChange={setShowNewDialog}
          defaultFolderId={folderId}
          onSuccess={handleNewSuccess}
        />
      </>
    );
  }

  // 有錯題時的顯示
  return (
    <>
      <div className="space-y-6">
        {/* 操作按鈕 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              本資料夾錯題 ({questions.length})
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
            <Button
              onClick={() => setShowNewDialog(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              新增錯題
            </Button>
          </div>
        </div>

        {/* 錯題列表 - 網格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((question, index) => (
            <QuestionCard
              key={question?.id || `question-${index}`}
              question={question}
              onClick={() => {
                setSelectedQuestionId(question.id);
                setShowDetailDialog(true);
              }}
              onEdit={() => {
                // TODO: Phase 1E - 開啟編輯對話框
                toast.info('編輯功能開發中...');
              }}
              onDelete={() => handleDelete(question.id)}
            />
          ))}
        </div>
      </div>

      {/* 新增錯題對話框 */}
      <NewQuestionDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        defaultFolderId={folderId}
        onSuccess={handleNewSuccess}
      />

      {/* 錯題詳情對話框 */}
      <QuestionDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        questionId={selectedQuestionId}
      />
    </>
  );
}
