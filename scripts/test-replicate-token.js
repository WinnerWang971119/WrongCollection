/**
 * 測試 Replicate API Token 是否正確設定
 * 執行: node scripts/test-replicate-token.js
 */

// 載入環境變數
require('dotenv').config({ path: '.env.local' });

console.log('🔍 檢查環境變數...\n');

const token = process.env.REPLICATE_API_TOKEN;

if (!token) {
  console.error('❌ REPLICATE_API_TOKEN 未設定');
  console.log('\n請檢查 .env.local 檔案是否包含：');
  console.log('REPLICATE_API_TOKEN=r8_...\n');
  process.exit(1);
}

console.log('✅ REPLICATE_API_TOKEN 已設定');
console.log('   前 8 個字元:', token.substring(0, 8));
console.log('   長度:', token.length, '字元');
console.log('   格式:', token.startsWith('r8_') ? '✅ 正確 (r8_...)' : '❌ 錯誤格式');

// 測試 Replicate SDK
console.log('\n🧪 測試 Replicate SDK...\n');

const Replicate = require('replicate');

try {
  const replicate = new Replicate({
    auth: token,
  });

  console.log('✅ Replicate SDK 初始化成功');
  console.log('✅ API Token 格式正確，可以使用');
} catch (error) {
  console.error('❌ Replicate SDK 初始化失敗:', error.message);
}

console.log('\n📝 如果 dev server 已經在運行，請重新啟動以載入新的環境變數');
console.log('   指令: npm run dev\n');
