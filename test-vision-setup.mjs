/**
 * 測試 Google Cloud Vision API 配置
 * 
 * 執行方式：node test-vision-setup.mjs
 */

import { ImageAnnotatorClient } from '@google-cloud/vision';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function testVisionAPI() {
  console.log('🔍 測試 Google Cloud Vision API 配置...\n');

  try {
    // 1. 檢查金鑰檔案
    const keyPath = join(__dirname, 'config', 'google-cloud-vision-key.json');
    console.log('📁 金鑰檔案路徑:', keyPath);
    
    const keyFile = readFileSync(keyPath, 'utf8');
    const credentials = JSON.parse(keyFile);
    
    console.log('✅ 金鑰檔案讀取成功');
    console.log('📋 專案 ID:', credentials.project_id);
    console.log('📧 服務帳戶:', credentials.client_email);
    console.log('');

    // 2. 建立 Vision API 客戶端
    console.log('🔧 建立 Vision API 客戶端...');
    const client = new ImageAnnotatorClient({
      keyFilename: keyPath,
    });
    console.log('✅ 客戶端建立成功\n');

    // 3. 測試簡單的文字辨識（使用測試圖片 URL）
    console.log('🧪 測試 OCR 功能（使用線上測試圖片）...');
    const testImageUrl = 'https://cloud.google.com/static/vision/docs/images/bicycle_example.png';
    
    const [result] = await client.textDetection(testImageUrl);
    const detections = result.textAnnotations;

    if (detections && detections.length > 0) {
      console.log('✅ OCR 測試成功！');
      console.log('📝 辨識到的文字:', detections[0].description?.substring(0, 100) + '...');
      console.log('📊 辨識區塊數量:', detections.length - 1);
    } else {
      console.log('⚠️  未辨識到文字（但 API 連線正常）');
    }

    console.log('\n🎉 所有測試通過！Vision API 配置正確！');
    return true;

  } catch (error) {
    console.error('\n❌ 測試失敗:', error.message);
    
    if (error.message.includes('ENOENT')) {
      console.error('\n💡 錯誤原因：找不到金鑰檔案');
      console.error('請確認：');
      console.error('1. 金鑰檔案是否放在 config/google-cloud-vision-key.json');
      console.error('2. 檔案名稱是否正確');
    } else if (error.message.includes('permission')) {
      console.error('\n💡 錯誤原因：權限不足');
      console.error('請確認：');
      console.error('1. 服務帳戶是否有 Cloud Vision API User 角色');
      console.error('2. Vision API 是否已啟用');
    } else if (error.message.includes('quota')) {
      console.error('\n💡 錯誤原因：配額不足');
      console.error('請確認：');
      console.error('1. Google Cloud 專案是否有計費帳戶');
      console.error('2. Vision API 配額是否用完');
    }
    
    return false;
  }
}

// 執行測試
testVisionAPI().then((success) => {
  process.exit(success ? 0 : 1);
});
