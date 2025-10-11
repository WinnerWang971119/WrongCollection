/**
 * AI 移除筆跡 API Route
 * 使用 Replicate LaMa Inpainting 模型
 */

import { NextRequest, NextResponse } from 'next/server';
const Replicate = require('replicate');
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // Replicate 可能需要較長時間

/**
 * POST /api/ai/remove-ink
 * 
 * Body:
 * {
 *   image: string (base64 data URL 或公開 URL)
 *   mask: string (base64 data URL 或公開 URL)
 * }
 */
export async function POST(req: NextRequest) {
  const logId = Date.now();
  console.log(`🧹 [API ${logId}] 開始處理移除筆跡請求`);

  try {
    // 1. 驗證使用者身份
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`❌ [API ${logId}] 未授權`, authError);
      return NextResponse.json({ 
        error: '未授權',
        logId,
        authError: authError?.message 
      }, { status: 401 });
    }

    console.log(`✅ [API ${logId}] 使用者已驗證: ${user.id}`);

    // 2. 解析請求
    const body = await req.json();
    const { image, mask } = body;

    if (!image || !mask) {
      console.error('❌ [API] 缺少必要參數');
      return NextResponse.json(
        { error: '缺少 image 或 mask 參數' },
        { status: 400 }
      );
    }

    console.log('📥 [API] 收到圖片和遮罩');

    // 3. 檢查 API Token
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      console.error('❌ [API] 缺少 REPLICATE_API_TOKEN 環境變數');
      return NextResponse.json(
        { error: '伺服器配置錯誤：缺少 Replicate API Token' },
        { status: 500 }
      );
    }

    console.log('✅ [API] API Token 已設定:', apiToken.substring(0, 8) + '...');

    // 4. 初始化 Replicate
    let replicate;
    try {
      replicate = new Replicate({
        auth: apiToken,
      });
      console.log('✅ [API] Replicate 客戶端初始化成功');
    } catch (initError: any) {
      console.error('❌ [API] Replicate 初始化失敗:', initError);
      return NextResponse.json(
        { error: 'Replicate 初始化失敗', details: initError.message },
        { status: 500 }
      );
    }

    console.log('🤖 [API] 呼叫 Replicate LaMa 模型...');
    console.log('📊 [API] 圖片大小:', image.substring(0, 50) + '...');
    console.log('📊 [API] 遮罩大小:', mask.substring(0, 50) + '...');

    // 5. 呼叫 LaMa Inpainting 模型
    // 模型: andreasjansson/lama-inpainting
    // 輸入:
    //   - image: 原始圖片（base64 或 URL）
    //   - mask: 遮罩圖片（黑色=移除，白色=保留）
    const startTime = Date.now();

    try {
      const output = (await replicate.run(
        'andreasjansson/lama-inpainting:11ecfbad581c09d5d6782f4e733cadeb1fa633f5468d0e46c76cc0e7f47d6850',
        {
          input: {
            image: image,
            mask: mask,
          },
        }
      ) as unknown) as string; // 回傳 URL

      const processingTime = Date.now() - startTime;

      console.log(`✅ [API] Replicate 處理完成 (${processingTime}ms)`);
      console.log(`📤 [API] 結果 URL: ${output}`);

      // 6. 記錄 API 使用（未來可用於統計和計費）
      // TODO: 儲存到 api_usage 表
      // await supabase.from('api_usage').insert({
      //   user_id: user.id,
      //   api_type: 'ink_removal',
      //   cost: 0.005,
      //   processing_time: processingTime,
      // });

      // 7. 回傳結果
      return NextResponse.json({
        success: true,
        resultUrl: output,
        processingTime,
        message: '筆跡移除成功',
      });
    } catch (replicateError: any) {
      console.error('❌ [API] Replicate API 錯誤:', replicateError);
      throw new Error(`Replicate API 錯誤: ${replicateError.message || replicateError}`);
    }
  } catch (error: any) {
    console.error('❌ [API] 移除筆跡失敗:', error);
    console.error('❌ [API] 錯誤詳情:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3),
    });

    // 錯誤類型判斷
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: '處理逾時，請稍後再試', details: error.message },
        { status: 504 }
      );
    }

    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'API 請求過於頻繁，請稍後再試', details: error.message },
        { status: 429 }
      );
    }

    if (error.message?.includes('credit') || error.message?.includes('quota')) {
      return NextResponse.json(
        { error: 'Replicate 額度不足，請聯絡管理員', details: error.message },
        { status: 402 }
      );
    }

    if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
      return NextResponse.json(
        { error: 'API Token 無效，請檢查配置', details: error.message },
        { status: 401 }
      );
    }

    // 一般錯誤
    return NextResponse.json(
      {
        error: '移除筆跡失敗',
        details: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}
