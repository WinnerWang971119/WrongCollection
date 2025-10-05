// ============================================
// AllQuestionsTab Component - 全部錯題 Tab
// 說明：顯示本資料夾+所有子資料夾的錯題統計
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Layers, Sparkles, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getQuestions, deleteQuestion } from '@/lib/api/question.api';
import { QuestionCard, QuestionDetailDialog } from '@/components/questions';
import type { QuestionListItem } from '@/types/question.types';

interface AllQuestionsTabProps {
  folderId: string;
  folderName: string;
  refreshTrigger?: number;
}

export function AllQuestionsTab({ folderId, folderName, refreshTrigger = 0 }: AllQuestionsTabProps) {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // 載入錯題列表（包含子資料夾）
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await getQuestions({
        folder_id: folderId,
        include_subfolders: true, // 包含子資料夾
        difficulty: difficultyFilter === 'all' ? undefined : difficultyFilter,
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
  }, [folderId, difficultyFilter, refreshTrigger]);

  // 刪除錯題
  const handleDelete = async (questionId: string) => {
    if (!confirm('確定要刪除這個錯題嗎？此操作無法復原。')) {
      return;
    }

    try {
      await deleteQuestion(questionId);
      toast.success('✅ 錯題已刪除');
      loadQuestions();
    } catch (error) {
      console.error('刪除錯題失敗:', error);
      toast.error('❌ 刪除失敗');
    }
  };

  // 計算統計資訊
  const totalQuestions = questions.length;
  const reviewedCount = questions.filter(q => q.last_reviewed_at !== null).length;
  const notReviewedCount = totalQuestions - reviewedCount;

  // 按難度統計
  const easyCount = questions.filter(q => q.difficulty === 'easy').length;
  const mediumCount = questions.filter(q => q.difficulty === 'medium').length;
  const hardCount = questions.filter(q => q.difficulty === 'hard').length;

  // 載入中狀態
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

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
                  <li>• 可以按難度篩選，快速找到需要複習的題目</li>
                  <li>• 支援統計卡片，了解學習進度</li>
                  <li>• 「智能複習全部」會涵蓋所有子資料夾的錯題</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 有錯題時的顯示
  return (
    <div className="space-y-6">
      {/* 標題與操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            全部錯題 ({totalQuestions})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            顯示「{folderName}」及所有子資料夾的錯題
          </p>
        </div>
        <Button
          variant="outline"
          className="border-purple-300 text-purple-600 hover:bg-purple-50"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          智能複習全部
        </Button>
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
            <div className="text-3xl font-bold text-green-600 mb-1">
              {reviewedCount}
            </div>
            <div className="text-sm text-gray-600">已複習</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {notReviewedCount}
            </div>
            <div className="text-sm text-gray-600">待複習</div>
          </CardContent>
        </Card>
      </div>

      {/* 難度篩選按鈕 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">按難度篩選：</span>
        <div className="flex gap-2">
          <Button
            variant={difficultyFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDifficultyFilter('all')}
          >
            全部 ({totalQuestions})
          </Button>
          <Button
            variant={difficultyFilter === 'easy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDifficultyFilter('easy')}
            className={difficultyFilter === 'easy' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            ⭐ 簡單 ({easyCount})
          </Button>
          <Button
            variant={difficultyFilter === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDifficultyFilter('medium')}
            className={difficultyFilter === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
          >
            ⭐⭐ 中等 ({mediumCount})
          </Button>
          <Button
            variant={difficultyFilter === 'hard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDifficultyFilter('hard')}
            className={difficultyFilter === 'hard' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            ⭐⭐⭐ 困難 ({hardCount})
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

      {/* 錯題詳情對話框 */}
      <QuestionDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        questionId={selectedQuestionId}
      />
    </div>
  );
}
