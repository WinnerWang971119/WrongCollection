/**
 * OCR 文字辨識 API
 * 
 * POST /api/ocr/extract-text
 * 
 * 接收圖片，使用 Google Cloud Vision API 辨識文字
 * 支援：繁體中文、簡體中文、英文、數字、符號
 */

import { NextRequest, NextResponse } from 'next/server';
import { createVisionClient } from '@/lib/google-cloud/vision-client';
import { createClient } from '@/lib/supabase/server';

// 允許較大的請求體（圖片）
export const maxDuration = 30; // 最長 30 秒

/**
 * POST /api/ocr/extract-text
 * 
 * Request Body (FormData):
 * - image: File (圖片檔案)
 * 
 * Response:
 * - text: string (辨識結果)
 * - confidence: number (信心度 0-1)
 * - language: string (偵測語言)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📖 OCR 文字辨識 API - 開始處理');

    // 1. 驗證使用者登入
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ 使用者未登入:', authError);
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    console.log('✅ 使用者已驗證:', user.id);

    // 2. 解析圖片
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: '缺少圖片檔案' },
        { status: 400 }
      );
    }

    console.log('📷 圖片資訊:', {
      name: imageFile.name,
      type: imageFile.type,
      size: `${(imageFile.size / 1024).toFixed(2)} KB`,
    });

    // 3. 轉換為 Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. 呼叫 Google Cloud Vision API
    console.log('🔍 開始 OCR 辨識...');
    const visionClient = createVisionClient();
    
    const [result] = await visionClient.textDetection(buffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      console.log('⚠️ 未辨識到文字');
      return NextResponse.json({
        text: '',
        confidence: 0,
        language: 'unknown',
        message: '未辨識到文字內容',
      });
    }

    // 5. 處理辨識結果
    // detections[0] 是完整文字
    // detections[1...n] 是個別文字區塊
    const fullText = detections[0]?.description || '';
    
    // 計算平均信心度
    // 注意：textAnnotations 通常不包含 confidence，我們從 fullTextAnnotation 取得
    let averageConfidence = 0.85; // 預設值（Google Vision 通常很準確）
    
    if (result.fullTextAnnotation) {
      // 如果有 fullTextAnnotation，嘗試從 pages 獲取信心度
      const pages = result.fullTextAnnotation.pages;
      if (pages && pages.length > 0) {
        let totalConfidence = 0;
        let confidenceCount = 0;
        
        for (const page of pages) {
          if (page.confidence) {
            totalConfidence += page.confidence;
            confidenceCount++;
          }
        }
        
        if (confidenceCount > 0) {
          averageConfidence = totalConfidence / confidenceCount;
        }
      }
    }
    
    console.log('📊 信心度來源:', result.fullTextAnnotation ? 'fullTextAnnotation' : '預設值');

    // 偵測語言（簡單判斷）
    const hasChineseChars = /[\u4e00-\u9fa5]/.test(fullText);
    const hasEnglishChars = /[a-zA-Z]/.test(fullText);
    
    let language = 'unknown';
    if (hasChineseChars && hasEnglishChars) {
      language = 'zh-en';
    } else if (hasChineseChars) {
      language = 'zh';
    } else if (hasEnglishChars) {
      language = 'en';
    }

    console.log('✅ OCR 辨識完成:', {
      textLength: fullText.length,
      confidence: averageConfidence.toFixed(2),
      language,
    });

    // 6. 記錄 API 使用（未來實作配額系統）
    // TODO: 記錄到 api_usage 表

    return NextResponse.json({
      success: true,
      text: fullText,
      confidence: averageConfidence,
      language,
      characterCount: fullText.length,
      detectionCount: detections.length - 1, // 扣除第一個完整文字
    });

  } catch (error) {
    console.error('❌ OCR 處理失敗:', error);
    
    return NextResponse.json(
      { 
        error: 'OCR 處理失敗',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
