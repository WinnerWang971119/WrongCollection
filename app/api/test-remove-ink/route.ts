/**
 * 直接測試 Replicate API 呼叫（無認證）
 * 訪問: http://localhost:3000/api/test-remove-ink
 */

import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 [TEST-INK] 開始測試移除筆跡...');

  try {
    // 1. 檢查 Token
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json({
        success: false,
        error: 'Token 未設定',
      });
    }

    console.log('✅ [TEST-INK] Token:', apiToken.substring(0, 8) + '...');

    // 2. 載入 Replicate
    const Replicate = require('replicate');
    console.log('✅ [TEST-INK] Replicate 模組載入');

    // 3. 初始化
    const replicate = new Replicate({ auth: apiToken });
    console.log('✅ [TEST-INK] Replicate 客戶端初始化');

    // 4. 測試用的小圖片（1x1 像素的 PNG）
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const testMask = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    console.log('🤖 [TEST-INK] 呼叫 Replicate API...');
    console.log('📊 [TEST-INK] 圖片:', testImage.substring(0, 50) + '...');
    console.log('📊 [TEST-INK] 遮罩:', testMask.substring(0, 50) + '...');

    // 5. 實際呼叫 API
    const startTime = Date.now();
    
    // 使用 Bria Eraser - SOTA 物件移除模型（免費試用）
    const output = await replicate.run(
      'bria/eraser',
      {
        input: {
          image: testImage,
          mask: testMask,
        },
      }
    );

    const processingTime = Date.now() - startTime;

    console.log(`✅ [TEST-INK] 處理完成 (${processingTime}ms)`);
    console.log('📤 [TEST-INK] 結果:', output);

    return NextResponse.json({
      success: true,
      message: '✅ Replicate API 呼叫成功',
      output: output,
      processingTime,
      note: '這是測試用的 1x1 像素圖片，實際使用時會處理真實圖片',
    });

  } catch (error: any) {
    console.error('❌ [TEST-INK] 錯誤:', error);
    console.error('❌ [TEST-INK] 錯誤詳情:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5),
    });

    return NextResponse.json({
      success: false,
      error: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 10),
    });
  }
}
