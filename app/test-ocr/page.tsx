/**
 * OCR 測試頁面
 * 
 * 用於測試 Google Cloud Vision API 是否正常運作
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { extractTextFromImage, evaluateOCRQuality, formatOCRText } from '@/lib/api/ocr.api';
import { Upload, FileText, Loader2 } from 'lucide-react';

export default function OCRTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 顯示預覽
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 開始 OCR
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚀 開始 OCR 測試...');
      const ocrResult = await extractTextFromImage(file);
      console.log('✅ OCR 結果:', ocrResult);

      const quality = evaluateOCRQuality(ocrResult);
      console.log('📊 品質評估:', quality);

      setResult({
        ...ocrResult,
        quality,
        formattedText: formatOCRText(ocrResult.text),
      });
    } catch (err) {
      console.error('❌ OCR 失敗:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">🔍 OCR 功能測試</h1>

      {/* 上傳區 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>上傳圖片</CardTitle>
          <CardDescription>
            選擇一張包含文字的圖片進行辨識測試
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="ocr-test-upload"
              disabled={loading}
            />
            <label htmlFor="ocr-test-upload">
              <Button
                asChild
                disabled={loading}
                className="cursor-pointer"
              >
                <span>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      辨識中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      選擇圖片
                    </>
                  )}
                </span>
              </Button>
            </label>

            {selectedImage && (
              <div className="w-full max-w-md border rounded-lg overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 錯誤訊息 */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">❌ 辨識失敗</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-2">
              請檢查：
              <br />1. Google Cloud 金鑰檔案是否正確放置
              <br />2. Vision API 是否已啟用
              <br />3. .env.local 設定是否正確
            </p>
          </CardContent>
        </Card>
      )}

      {/* 辨識結果 */}
      {result && (
        <div className="space-y-6">
          {/* 統計資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>📊 辨識資訊</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">品質</p>
                  <p className="text-lg font-semibold">{result.quality.message}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">信心度</p>
                  <p className="text-lg font-semibold">
                    {(result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">字數</p>
                  <p className="text-lg font-semibold">{result.characterCount} 字</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">語言</p>
                  <p className="text-lg font-semibold">
                    {result.language === 'zh' && '中文'}
                    {result.language === 'en' && '英文'}
                    {result.language === 'zh-en' && '中英混合'}
                    {result.language === 'unknown' && '未知'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 辨識文字 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                辨識結果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap font-mono text-sm">
                  {result.formattedText || '(無文字)'}
                </p>
              </div>
              
              <Button
                className="mt-4"
                onClick={() => {
                  navigator.clipboard.writeText(result.formattedText);
                  alert('已複製到剪貼簿！');
                }}
              >
                📋 複製文字
              </Button>
            </CardContent>
          </Card>

          {/* 原始資料 */}
          <Card>
            <CardHeader>
              <CardTitle>🔍 原始資料（Debug）</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
