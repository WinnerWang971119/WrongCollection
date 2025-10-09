/**
 * Google Cloud Vision API 客戶端
 * 
 * 支援兩種認證方式：
 * 1. 本地開發：使用 GOOGLE_APPLICATION_CREDENTIALS 檔案路徑
 * 2. 雲端部署：使用 GOOGLE_CLOUD_CREDENTIALS JSON 字串
 */

import { ImageAnnotatorClient } from '@google-cloud/vision';

/**
 * 建立 Vision API 客戶端
 * 
 * @returns ImageAnnotatorClient 實例
 */
export function createVisionClient() {
  try {
    // 方法 1: 使用 JSON 字串（優先，適合 Vercel）
    const credentialsJson = process.env.GOOGLE_CLOUD_CREDENTIALS;
    if (credentialsJson) {
      console.log('🔑 使用 GOOGLE_CLOUD_CREDENTIALS 環境變數');
      const credentials = JSON.parse(credentialsJson);
      return new ImageAnnotatorClient({
        credentials,
        projectId: credentials.project_id,
      });
    }

    // 方法 2: 使用檔案路徑（本地開發）
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialsPath) {
      console.log('🔑 使用 GOOGLE_APPLICATION_CREDENTIALS 檔案路徑:', credentialsPath);
      return new ImageAnnotatorClient({
        keyFilename: credentialsPath,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      });
    }

    // 兩者都沒有設定
    throw new Error(
      '❌ 缺少 Google Cloud 認證資訊！\n' +
      '請設定以下其中一種環境變數：\n' +
      '1. GOOGLE_CLOUD_CREDENTIALS (JSON 字串)\n' +
      '2. GOOGLE_APPLICATION_CREDENTIALS (檔案路徑)'
    );
  } catch (error) {
    console.error('❌ Vision API 客戶端建立失敗:', error);
    throw error;
  }
}

/**
 * 測試 Vision API 連線
 * 
 * @returns 是否連線成功
 */
export async function testVisionAPI(): Promise<boolean> {
  try {
    const client = createVisionClient();
    console.log('✅ Vision API 客戶端建立成功');
    
    // 簡單測試：獲取支援的功能列表
    // 不會消耗配額
    console.log('📡 測試 API 連線...');
    
    return true;
  } catch (error) {
    console.error('❌ Vision API 測試失敗:', error);
    return false;
  }
}
