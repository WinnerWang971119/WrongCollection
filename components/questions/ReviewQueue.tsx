/**
 * ReviewQueue - 複習佇列元件
 * 
 * 顯示今日待複習的題目列表，支援：
 * - 優先級排序（逾期 → 新題目 → 難度高）
 * - 逾期提示
 * - 進度顯示
 * - 快速開始複習
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  Star, 
  AlertCircle, 
  CheckCircle2,
  PlayCircle,
  RefreshCw,
  TrendingUp,
  BookOpen,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { getDueQuestions } from '@/lib/api/question.api';
import { getStateLabel, getStateColor } from '@/lib/algorithms/sm2';
import { QuestionDetailDialog } from './QuestionDetailDialog';
import CustomReviewDialog from './CustomReviewDialog';

interface DueQuestion {
  id: string;
  title: string;
  difficulty: string; // API 回傳 string，需要轉換
  wrong_count: number;
  review_state: string;
  next_review_date: string | null;
  last_quality: number | null;
  repetitions: number;
  is_overdue: boolean;
  days_overdue: number;
}

interface ReviewQueueProps {
  /** 最多顯示幾題 */
  limit?: number;
  /** 開始複習的回調 */
  onStartReview?: () => void;
}

export function ReviewQueue({ limit = 50, onStartReview }: ReviewQueueProps) {
  const [questions, setQuestions] = useState<DueQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // 載入待複習題目
  const loadDueQuestions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('📚 載入今日待複習題目...');
      const data = await getDueQuestions(limit);
      
      console.log(`✅ 取得 ${data.length} 題待複習`);
      setQuestions(data);

      if (isRefresh) {
        toast.success(`✅ 已更新，共 ${data.length} 題待複習`);
      }
    } catch (error) {
      console.error('載入待複習題目失敗:', error);
      toast.error('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 初始載入
  useEffect(() => {
    loadDueQuestions();
  }, []);

  // 開始複習（顯示第一題）
  const handleStartReview = () => {
    if (questions.length === 0) {
      toast.info('🎉 沒有待複習的題目！');
      return;
    }

    setCurrentQuestionId(questions[0].id);
    setShowDetailDialog(true);
    onStartReview?.();
  };

  // 複習完成後
  const handleReviewComplete = () => {
    setCompletedCount(prev => prev + 1);
    
    // 找到下一題
    const currentIndex = questions.findIndex(q => q.id === currentQuestionId);
    const nextQuestion = questions[currentIndex + 1];

    if (nextQuestion) {
      // 顯示下一題
      setCurrentQuestionId(nextQuestion.id);
    } else {
      // 所有題目複習完畢
      setShowDetailDialog(false);
      toast.success(`🎉 今日複習完成！共複習 ${completedCount + 1} 題`);
      
      // 重新載入列表
      loadDueQuestions(true);
      setCompletedCount(0);
    }
  };

  // 自訂複習
  const handleCustomReview = (customQuestions: any[]) => {
    setQuestions(customQuestions);
    setIsCustomMode(true);
    setCompletedCount(0);
    toast.success(`✅ 已載入 ${customQuestions.length} 題自訂複習題目`);
  };

  // 點擊特定題目
  const handleQuestionClick = (questionId: string) => {
    setCurrentQuestionId(questionId);
    setShowDetailDialog(true);
  };

  // 統計資訊
  const stats = {
    total: questions.length,
    overdue: questions.filter(q => q.is_overdue).length,
    new: questions.filter(q => q.review_state === 'new').length,
    learning: questions.filter(q => q.review_state === 'learning').length,
    review: questions.filter(q => q.review_state === 'review').length,
  };

  // 進度百分比
  const progress = questions.length > 0 
    ? Math.round((completedCount / questions.length) * 100) 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            今日複習佇列
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {isCustomMode ? '自訂複習' : '今日複習佇列'}
              {questions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {questions.length} 題
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomDialog(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                自訂複習
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCustomMode(false);
                  loadDueQuestions(true);
                }}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 統計卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-blue-600">總計</div>
            </div>
            {stats.overdue > 0 && (
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                <div className="text-xs text-red-600">逾期</div>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.new}</div>
              <div className="text-xs text-gray-600">新題目</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.learning}</div>
              <div className="text-xs text-yellow-600">學習中</div>
            </div>
          </div>

          {/* 進度條（複習中才顯示） */}
          {completedCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">複習進度</span>
                <span className="font-semibold text-blue-600">
                  {completedCount} / {questions.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* 空狀態 */}
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                🎉 太棒了！
              </h3>
              <p className="text-gray-600">
                今天沒有需要複習的題目
              </p>
              <p className="text-sm text-gray-500 mt-2">
                繼續保持，明天再來吧！
              </p>
            </div>
          ) : (
            <>
              {/* 開始複習按鈕 */}
              <Button
                size="lg"
                onClick={handleStartReview}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                {completedCount > 0 ? '繼續複習' : '開始複習'}
              </Button>

              {/* 題目列表 */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  待複習題目（按優先級排序）
                </h4>
                
                {questions.map((question, index) => (
                  <Card
                    key={question.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      question.is_overdue 
                        ? 'border-red-200 bg-red-50' 
                        : index < completedCount
                        ? 'opacity-50 bg-gray-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleQuestionClick(question.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        {/* 左側：題目資訊 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-500">
                              #{index + 1}
                            </span>
                            <h5 className="font-medium text-gray-900 truncate">
                              {question.title}
                            </h5>
                            {index < completedCount && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* 狀態標籤 */}
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getStateColor(question.review_state as any)}`}
                            >
                              {getStateLabel(question.review_state as any)}
                            </Badge>

                            {/* 難度 */}
                            <div className="flex items-center gap-1">
                              {Array.from({ 
                                length: question.difficulty === 'hard' ? 3 : question.difficulty === 'medium' ? 2 : 1 
                              }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${
                                    question.difficulty === 'hard' ? 'text-red-500' :
                                    question.difficulty === 'medium' ? 'text-yellow-500' :
                                    'text-green-500'
                                  } fill-current`} 
                                />
                              ))}
                            </div>

                            {/* 錯誤次數 */}
                            {question.wrong_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                錯 {question.wrong_count} 次
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* 右側：逾期警告 */}
                        {question.is_overdue && (
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="destructive" className="whitespace-nowrap">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              逾期
                            </Badge>
                            <span className="text-xs text-red-600">
                              {question.days_overdue} 天
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 複習對話框 */}
      <QuestionDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        questionId={currentQuestionId}
        onReviewComplete={handleReviewComplete}
      />

      {/* 自訂複習對話框 */}
      <CustomReviewDialog
        open={showCustomDialog}
        onOpenChange={setShowCustomDialog}
        onStartReview={handleCustomReview}
      />
    </>
  );
}
