// ============================================
// QuestionDetailDialog - 錯題詳情對話框
// ============================================

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Eye, EyeOff, Calendar, FolderOpen, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getQuestionById, markAsCorrect, markAsWrong } from '@/lib/api/question.api';
import type { QuestionWithFolders } from '@/types/question.types';

interface QuestionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string | null;
  onReviewComplete?: () => void; // 複習完成後的回調
}

export function QuestionDetailDialog({
  open,
  onOpenChange,
  questionId,
  onReviewComplete,
}: QuestionDetailDialogProps) {
  const [question, setQuestion] = useState<QuestionWithFolders | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 載入錯題詳情
  useEffect(() => {
    if (open && questionId) {
      loadQuestion();
    } else {
      setQuestion(null);
      setShowAnswer(false);
    }
  }, [open, questionId]);

  const loadQuestion = async () => {
    if (!questionId) return;

    try {
      setLoading(true);
      const data = await getQuestionById(questionId);
      setQuestion(data);
    } catch (error) {
      console.error('載入錯題詳情失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>載入中...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!question) return null;

  // 難度星星
  const difficultyStars = {
    easy: 1,
    medium: 2,
    hard: 3,
  };

  const difficultyColors = {
    easy: 'text-green-500',
    medium: 'text-yellow-500',
    hard: 'text-red-500',
  };

  const difficultyLabels = {
    easy: '簡單',
    medium: '中等',
    hard: '困難',
  };

  const starCount = difficultyStars[question.difficulty];
  const starColor = difficultyColors[question.difficulty];
  const difficultyLabel = difficultyLabels[question.difficulty];

  // 格式化時間
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '尚未複習';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '時間格式錯誤';
    }
  };

  // 處理答對
  const handleCorrect = async () => {
    if (!questionId || submitting) return;

    try {
      setSubmitting(true);
      await markAsCorrect(questionId);
      toast.success('✅ 已標記為答對！錯誤次數 -1');
      
      // 重新載入錯題資料
      await loadQuestion();
      
      // 通知父元件刷新
      onReviewComplete?.();
      
      // 可選：關閉對話框
      // onOpenChange(false);
    } catch (error) {
      console.error('標記答對失敗:', error);
      toast.error('標記答對失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  // 處理答錯
  const handleWrong = async () => {
    if (!questionId || submitting) return;

    try {
      setSubmitting(true);
      await markAsWrong(questionId);
      toast.error('❌ 已標記為答錯！錯誤次數 +1');
      
      // 重新載入錯題資料
      await loadQuestion();
      
      // 通知父元件刷新
      onReviewComplete?.();
      
      // 可選：關閉對話框
      // onOpenChange(false);
    } catch (error) {
      console.error('標記答錯失敗:', error);
      toast.error('標記答錯失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <span>{question.title}</span>
            {/* 難度星星 */}
            <div className="flex items-center gap-1">
              {Array.from({ length: starCount }).map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${starColor} fill-current`} />
              ))}
              <span className={`text-sm font-medium ml-1 ${starColor}`}>
                {difficultyLabel}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 資料夾標籤 */}
          {question.folders && question.folders.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.folders.map((folder) => (
                <Badge key={folder.id} variant="outline" className="text-sm">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  {folder.name}
                </Badge>
              ))}
            </div>
          )}

          {/* 題目卡片 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📝 題目</h3>
              
              {/* 題目圖片 */}
              {question.question_image_url && (
                <div className="mb-4">
                  <img
                    src={question.question_image_url}
                    alt="題目圖片"
                    className="max-w-full rounded-lg border border-blue-200"
                  />
                </div>
              )}

              {/* 題目文字 */}
              {question.question_text && (
                <div className="text-gray-800 whitespace-pre-wrap">
                  {question.question_text}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 顯示/隱藏答案按鈕 */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => setShowAnswer(!showAnswer)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {showAnswer ? (
                <>
                  <EyeOff className="mr-2 h-5 w-5" />
                  隱藏答案
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  顯示答案
                </>
              )}
            </Button>
          </div>

          {/* 答案區域（翻轉顯示） */}
          {showAnswer && (
            <div className="space-y-4 animate-in fade-in duration-500">
              {/* 我的答案 */}
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">❌ 我的答案（錯誤）</h3>
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {question.my_answer}
                  </div>
                </CardContent>
              </Card>

              {/* 正確答案 */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">✅ 正確答案</h3>
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {question.correct_answer}
                  </div>
                </CardContent>
              </Card>

              {/* 詳解 */}
              {question.explanation && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">💡 詳解</h3>
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {question.explanation}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 統計資訊 */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">錯誤 {question.wrong_count} 次</Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>最後複習：{formatDate(question.last_reviewed_at)}</span>
                </div>
                <div className="col-span-2 text-gray-500 text-xs">
                  創建於 {formatDate(question.created_at)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 手動複習按鈕（只在顯示答案後出現） */}
          {showAnswer && (
            <DialogFooter className="gap-3">
              <Button
                variant="destructive"
                size="lg"
                onClick={handleWrong}
                disabled={submitting}
                className="flex-1 text-lg py-6"
              >
                <XCircle className="mr-2 h-5 w-5" />
                {submitting ? '處理中...' : '❌ 我答錯了'}
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={handleCorrect}
                disabled={submitting}
                className="flex-1 text-lg py-6 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                {submitting ? '處理中...' : '✅ 我答對了'}
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
