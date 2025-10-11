/**
 * 測試 Replicate API 連接
 * 訪問: http://localhost:3000/api/test-replicate
 */

import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 [TEST] 開始測試 Replicate...');

  try {
    // 1. 檢查環境變數
    const token = process.env.REPLICATE_API_TOKEN;
    
    if (!token) {
      console.error('❌ [TEST] REPLICATE_API_TOKEN 未設定');
      return NextResponse.json({
        success: false,
        error: 'REPLICATE_API_TOKEN 未設定',
        hint: '請確認 .env.local 包含此環境變數，並重新啟動 dev server',
      });
    }

    console.log('✅ [TEST] Token 已設定:', token.substring(0, 8) + '...');

    // 2. 嘗試載入 Replicate
    let Replicate;
    try {
      Replicate = require('replicate');
      console.log('✅ [TEST] Replicate 模組載入成功');
    } catch (requireError: any) {
      console.error('❌ [TEST] Replicate 模組載入失敗:', requireError);
      return NextResponse.json({
        success: false,
        error: 'Replicate 模組載入失敗',
        details: requireError.message,
        hint: '執行: npm install replicate --force',
      });
    }

    // 3. 嘗試初始化 Replicate 客戶端
    let replicate;
    try {
      replicate = new Replicate({
        auth: token,
      });
      console.log('✅ [TEST] Replicate 客戶端初始化成功');
    } catch (initError: any) {
      console.error('❌ [TEST] Replicate 客戶端初始化失敗:', initError);
      return NextResponse.json({
        success: false,
        error: 'Replicate 客戶端初始化失敗',
        details: initError.message,
        stack: initError.stack?.split('\n').slice(0, 5),
      });
    }

    // 4. 測試 API 連接（不實際執行模型，只驗證認證）
    try {
      // 嘗試列出模型（輕量級的 API 呼叫）
      console.log('🔍 [TEST] 測試 API 連接...');
      
      // 這只是測試 Token 是否有效，不會真的執行模型
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [TEST] API 連接失敗:', response.status, errorText);
        
        if (response.status === 401) {
          return NextResponse.json({
            success: false,
            error: 'API Token 無效',
            details: '請檢查 Replicate Dashboard 確認 Token 是否正確',
            hint: 'https://replicate.com/account/api-tokens',
          });
        }

        return NextResponse.json({
          success: false,
          error: `API 連接失敗 (${response.status})`,
          details: errorText,
        });
      }

      console.log('✅ [TEST] API 連接成功');

      // 5. 測試完成
      return NextResponse.json({
        success: true,
        message: '✅ Replicate 設定正確，可以正常使用',
        checks: {
          token: '✅ 已設定',
          module: '✅ 載入成功',
          client: '✅ 初始化成功',
          api: '✅ 連接成功',
        },
        tokenPreview: token.substring(0, 8) + '...',
        nextSteps: [
          '1. 環境設定完成',
          '2. 可以開始測試移除筆跡功能',
          '3. 首次呼叫可能需要 15-30 秒（cold start）',
        ],
      });

    } catch (apiError: any) {
      console.error('❌ [TEST] API 測試失敗:', apiError);
      return NextResponse.json({
        success: false,
        error: 'API 測試失敗',
        details: apiError.message,
        stack: apiError.stack?.split('\n').slice(0, 5),
      });
    }

  } catch (error: any) {
    console.error('❌ [TEST] 未預期的錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '未預期的錯誤',
      details: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    });
  }
}
