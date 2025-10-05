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
import { Star, Eye, EyeOff, Calendar, FolderOpen, CheckCircle2, XCircle, RotateCcw, Frown, Meh, Smile, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getQuestionById, markAsCorrect, markAsWrong, submitReviewQuality } from '@/lib/api/question.api';
import { getImagePublicUrl } from '@/lib/supabase/storage';
import { ReviewQuality, getQualityLabel, getQualityColor } from '@/lib/algorithms/sm2';
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

  // 處理品質評分（SM-2 演算法）
  const handleQualityRating = async (quality: ReviewQuality) => {
    if (!questionId || submitting) return;

    const qualityLabels = {
      [ReviewQuality.AGAIN]: '再來一次',
      [ReviewQuality.HARD]: '困難',
      [ReviewQuality.GOOD]: '良好',
      [ReviewQuality.EASY]: '簡單',
    };

    try {
      setSubmitting(true);
      console.log(`📊 提交品質評分: ${qualityLabels[quality]} (${quality})`);
      
      const result = await submitReviewQuality(questionId, quality as 1 | 2 | 3 | 4);
      
      console.log('✅ SM-2 計算結果:', result.sm2Result);
      console.log('📅 下次複習日期:', result.sm2Result.nextReviewDate);
      console.log('📊 統計:', result.stats);
      
      // 顯示成功訊息
      const nextDate = new Date(result.sm2Result.nextReviewDate).toLocaleDateString('zh-CN');
      toast.success(
        `✅ 已記錄複習：${qualityLabels[quality]}\n` +
        `📅 下次複習：${nextDate}\n` +
        `📈 正確率：${result.stats.accuracy.toFixed(1)}%`
      );
      
      // 重新載入錯題資料
      await loadQuestion();
      
      // 通知父元件刷新
      onReviewComplete?.();
    } catch (error) {
      console.error('提交品質評分失敗:', error);
      toast.error('提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  // 處理答對（保留向下相容）
  const handleCorrect = async () => {
    await handleQualityRating(ReviewQuality.GOOD);
  };

  // 處理答錯（保留向下相容）
  const handleWrong = async () => {
    await handleQualityRating(ReviewQuality.AGAIN);
  };

  // 載入錯題詳情
  useEffect(() => {
    if (open && questionId) {
      loadQuestion();
    } else {
      setQuestion(null);
      setShowAnswer(false);
    }
  }, [open, questionId]);

  // 鍵盤快捷鍵
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 防止在其他輸入框中觸發
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Space: 切換顯示/隱藏答案
      if (event.code === 'Space') {
        event.preventDefault();
        setShowAnswer(prev => !prev);
        return;
      }

      // 只在顯示答案且未在提交中時才能使用方向鍵
      if (!showAnswer || submitting) return;

      // 數字鍵 1-4：品質評分
      if (event.code === 'Digit1' || event.code === 'Numpad1') {
        event.preventDefault();
        handleQualityRating(ReviewQuality.AGAIN);
      } else if (event.code === 'Digit2' || event.code === 'Numpad2') {
        event.preventDefault();
        handleQualityRating(ReviewQuality.HARD);
      } else if (event.code === 'Digit3' || event.code === 'Numpad3') {
        event.preventDefault();
        handleQualityRating(ReviewQuality.GOOD);
      } else if (event.code === 'Digit4' || event.code === 'Numpad4') {
        event.preventDefault();
        handleQualityRating(ReviewQuality.EASY);
      }
      // ArrowLeft: 答錯 (映射到 Again)
      else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        handleQualityRating(ReviewQuality.AGAIN);
      }
      // ArrowRight: 答對 (映射到 Good)
      else if (event.code === 'ArrowRight') {
        event.preventDefault();
        handleQualityRating(ReviewQuality.GOOD);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, showAnswer, submitting, questionId]);

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
          {/* 鍵盤快捷鍵提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <div className="flex items-center gap-4 justify-center flex-wrap">
              <span className="font-semibold">⌨️ 鍵盤快捷鍵：</span>
              <span><kbd className="px-2 py-1 bg-white rounded border border-blue-300">Space</kbd> 顯示/隱藏答案</span>
              <span><kbd className="px-2 py-1 bg-white rounded border border-blue-300">1-4</kbd> 品質評分</span>
              <span><kbd className="px-2 py-1 bg-white rounded border border-blue-300">←</kbd> 再來一次</span>
              <span><kbd className="px-2 py-1 bg-white rounded border border-blue-300">→</kbd> 良好</span>
            </div>
          </div>

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
              
              {/* 題目圖片（多張圖片網格顯示） */}
              {question.question_images && question.question_images.length > 0 && (
                <div className={`mb-4 ${question.question_images.length === 1 ? '' : 'grid grid-cols-2 gap-3'}`}>
                  {question.question_images.map((imagePath, index) => {
                    const imageUrl = getImagePublicUrl(imagePath);
                    return (
                      <div key={index} className="relative">
                        <img
                          src={imageUrl}
                          alt={`題目圖片 ${index + 1}`}
                          className="w-full h-auto rounded-lg border border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                        <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          {index + 1}/{question.question_images.length}
                        </span>
                      </div>
                    );
                  })}
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
                  隱藏答案 (Space)
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  顯示答案 (Space)
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
                    
                    {/* 詳解圖片（多張圖片網格顯示） */}
                    {question.explanation_images && question.explanation_images.length > 0 && (
                      <div className={`mb-4 ${question.explanation_images.length === 1 ? '' : 'grid grid-cols-2 gap-3'}`}>
                        {question.explanation_images.map((imagePath, index) => {
                          const imageUrl = getImagePublicUrl(imagePath);
                          return (
                            <div key={index} className="relative">
                              <img
                                src={imageUrl}
                                alt={`詳解圖片 ${index + 1}`}
                                className="w-full h-auto rounded-lg border border-purple-200 hover:border-purple-400 transition-colors cursor-pointer"
                                onClick={() => window.open(imageUrl, '_blank')}
                              />
                              <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                                {index + 1}/{question.explanation_images.length}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 詳解文字 */}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">錯誤 {question.wrong_count} 次</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {question.review_state === 'new' && '新題目'}
                    {question.review_state === 'learning' && '學習中'}
                    {question.review_state === 'review' && '複習中'}
                    {question.review_state === 'mastered' && '已精通'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>複習：{question.total_reviews || 0} 次</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>正確率：{
                    question.total_reviews > 0
                      ? ((question.correct_reviews / question.total_reviews) * 100).toFixed(0)
                      : 0
                  }%</span>
                </div>
                <div className="col-span-2 text-gray-500 text-xs">
                  最後複習：{formatDate(question.last_reviewed_at)}
                </div>
                <div className="col-span-2 text-gray-500 text-xs">
                  {question.next_review_date && (
                    <>下次複習：{formatDate(question.next_review_date)}</>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SM-2 品質評分按鈕（只在顯示答案後出現） */}
          {showAnswer && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  📊 請評估這道題的難度
                </h3>
                <p className="text-sm text-gray-600">
                  評分將影響下次複習時間（SM-2 演算法）
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1 - Again */}
                <Button
                  size="lg"
                  onClick={() => handleQualityRating(ReviewQuality.AGAIN)}
                  disabled={submitting}
                  className="flex-col h-auto py-6 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-200 hover:border-red-300"
                  variant="outline"
                >
                  <RotateCcw className="h-8 w-8 mb-2" />
                  <span className="text-base font-semibold">再來一次</span>
                  <span className="text-xs mt-1 opacity-75">完全不記得</span>
                  <kbd className="mt-2 px-2 py-1 bg-white rounded text-xs border border-red-300">1 或 ←</kbd>
                </Button>

                {/* 2 - Hard */}
                <Button
                  size="lg"
                  onClick={() => handleQualityRating(ReviewQuality.HARD)}
                  disabled={submitting}
                  className="flex-col h-auto py-6 bg-orange-50 hover:bg-orange-100 text-orange-700 border-2 border-orange-200 hover:border-orange-300"
                  variant="outline"
                >
                  <Frown className="h-8 w-8 mb-2" />
                  <span className="text-base font-semibold">困難</span>
                  <span className="text-xs mt-1 opacity-75">記得但很吃力</span>
                  <kbd className="mt-2 px-2 py-1 bg-white rounded text-xs border border-orange-300">2</kbd>
                </Button>

                {/* 3 - Good */}
                <Button
                  size="lg"
                  onClick={() => handleQualityRating(ReviewQuality.GOOD)}
                  disabled={submitting}
                  className="flex-col h-auto py-6 bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200 hover:border-green-300"
                  variant="outline"
                >
                  <Smile className="h-8 w-8 mb-2" />
                  <span className="text-base font-semibold">良好</span>
                  <span className="text-xs mt-1 opacity-75">正常記得</span>
                  <kbd className="mt-2 px-2 py-1 bg-white rounded text-xs border border-green-300">3 或 →</kbd>
                </Button>

                {/* 4 - Easy */}
                <Button
                  size="lg"
                  onClick={() => handleQualityRating(ReviewQuality.EASY)}
                  disabled={submitting}
                  className="flex-col h-auto py-6 bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200 hover:border-blue-300"
                  variant="outline"
                >
                  <Sparkles className="h-8 w-8 mb-2" />
                  <span className="text-base font-semibold">簡單</span>
                  <span className="text-xs mt-1 opacity-75">很輕鬆記得</span>
                  <kbd className="mt-2 px-2 py-1 bg-white rounded text-xs border border-blue-300">4</kbd>
                </Button>
              </div>

              {submitting && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>計算下次複習時間...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
