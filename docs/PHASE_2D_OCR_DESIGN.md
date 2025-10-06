# Phase 2D - OCR 圖片智能處理系統設計方案

## 📋 需求概述

### 核心功能
1. ✏️ **移除筆跡** - 擦除手寫答案/過程
2. 🎨 **白底黑字標準化** - 去光差、統一格式
3. 📝 **OCR 文字辨識** - 圖片轉文字

### 使用場景
- 📸 拍攝練習題（已寫上答案）
- 📖 掃描教科書（光線不均）
- 📄 考卷照片（有折痕/陰影）

---

## 🔧 功能 1：移除筆跡

### 方案 A：AI Inpainting - 智能修復（推薦 ⭐⭐⭐⭐⭐）

#### 技術原理
使用 AI 模型（如 Stable Diffusion Inpainting）將筆跡區域視為「需要修復的破損」，智能填充背景。

#### 優點
- ✅ 效果最好：可移除複雜筆跡
- ✅ 保留原始內容：不會破壞印刷文字
- ✅ 智能判斷：自動識別筆跡 vs 印刷

#### 缺點
- ❌ 成本高：API 呼叫需付費
- ❌ 速度慢：單張圖 2-5 秒
- ❌ 需要標記：使用者需手動框選筆跡區域

#### 實作方式

**選項 A1：Replicate API（推薦）**
```typescript
// 使用 Stable Diffusion Inpainting
import Replicate from 'replicate';

async function removeInk(imageUrl: string, maskUrl: string) {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  const output = await replicate.run(
    "stability-ai/stable-diffusion-inpainting:...",
    {
      input: {
        image: imageUrl,        // 原圖
        mask: maskUrl,          // 筆跡遮罩（使用者標記）
        prompt: "clean textbook page without handwriting",
        negative_prompt: "handwriting, scribbles, notes"
      }
    }
  );
  
  return output; // 清理後的圖片
}
```

**費用**：
- Replicate: $0.0023/秒（約 $0.01/張）
- 月成本估算：100 張圖 = $1 USD

**選項 A2：OpenCV + 傳統算法（免費但效果差）**
```python
# 基於顏色篩選（僅適用於彩色筆跡）
import cv2
import numpy as np

def remove_blue_ink(image):
    # HSV 色彩空間轉換
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # 藍色筆跡範圍
    lower_blue = np.array([100, 50, 50])
    upper_blue = np.array([130, 255, 255])
    
    # 建立遮罩
    mask = cv2.inRange(hsv, lower_blue, upper_blue)
    
    # 修復（簡單填充白色）
    image[mask > 0] = [255, 255, 255]
    
    return image
```

**限制**：
- ❌ 僅適用於彩色筆（藍/紅筆）
- ❌ 黑色鉛筆無法處理
- ❌ 可能誤刪印刷內容

---

### 方案 B：手動標記 + Eraser Tool（簡易版）

#### 技術原理
提供前端畫筆工具，讓使用者塗抹要清除的區域，後端簡單填充白色。

#### 優點
- ✅ 成本低：無 API 費用
- ✅ 精準控制：使用者決定清除範圍
- ✅ 實作簡單：Canvas API

#### 缺點
- ❌ 體驗差：需要手動塗抹
- ❌ 效果粗糙：填充白色不自然

#### 實作方式

```typescript
// 前端 Canvas Eraser
import { useRef, useState } from 'react';

function ImageEraser({ imageUrl }: { imageUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    // 白色畫筆模式
    ctx.globalCompositeOperation = 'destination-out'; // 擦除模式
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.beginPath();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    const rect = canvasRef.current?.getBoundingClientRect();
    
    const x = e.clientX - rect!.left;
    const y = e.clientY - rect!.top;
    
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDrawing(false)}
    />
  );
}
```

---

### 方案 C：AI 自動檢測筆跡（進階版）

#### 技術原理
先用 AI 模型自動偵測筆跡位置，再用 Inpainting 修復。

#### 優點
- ✅ 自動化：無需手動標記
- ✅ 效果好：AI 判斷準確

#### 缺點
- ❌ 成本最高：兩次 API 呼叫
- ❌ 複雜度高：需要兩個模型

#### 實作方式

```typescript
// Step 1: 檢測筆跡（使用 Segment Anything Model）
async function detectHandwriting(imageUrl: string) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: "sam-model-version-id",
      input: {
        image: imageUrl,
        prompt: "detect handwriting and annotations"
      }
    })
  });
  
  const result = await response.json();
  return result.mask_url; // 筆跡遮罩
}

// Step 2: 移除筆跡（同方案 A1）
```

**費用**：
- SAM 模型：$0.005/張
- Inpainting：$0.01/張
- **總計：$0.015/張**

---

## 🎨 功能 2：白底黑字標準化

### 技術名稱
- **中文**：二值化（Binarization）、去光差處理
- **英文**：Adaptive Thresholding、Deskewing、Denoising

### 方案 A：本地處理 - OpenCV.js（推薦 ⭐⭐⭐⭐⭐）

#### 技術原理
在瀏覽器中使用 OpenCV.js 進行圖像處理（無需後端）。

#### 優點
- ✅ 免費：完全本地處理
- ✅ 快速：即時預覽
- ✅ 隱私：圖片不上傳伺服器
- ✅ 效果好：專業級算法

#### 實作方式

```typescript
// lib/image-processing/normalize.ts
import cv from '@techstark/opencv-js';

export async function normalizeImage(file: File): Promise<Blob> {
  // 1. 載入圖片
  const img = await loadImage(file);
  const src = cv.imread(img);
  
  // 2. 轉灰階
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  
  // 3. 自適應二值化（處理光線不均）
  const binary = new cv.Mat();
  cv.adaptiveThreshold(
    gray,
    binary,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY,
    11, // 區塊大小
    2   // 常數
  );
  
  // 4. 去噪（移除雜點）
  const denoised = new cv.Mat();
  cv.medianBlur(binary, denoised, 3);
  
  // 5. 邊緣增強
  const kernel = cv.Mat.ones(2, 2, cv.CV_8U);
  cv.morphologyEx(denoised, denoised, cv.MORPH_CLOSE, kernel);
  
  // 6. 轉回白底黑字（如果需要反轉）
  cv.bitwise_not(denoised, denoised);
  
  // 7. 輸出
  const canvas = document.createElement('canvas');
  cv.imshow(canvas, denoised);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
  
  // 清理記憶體
  src.delete();
  gray.delete();
  binary.delete();
  denoised.delete();
  kernel.delete();
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
```

#### 使用範例

```typescript
// components/questions/ImagePreprocessor.tsx
import { normalizeImage } from '@/lib/image-processing/normalize';

async function handleNormalize() {
  setProcessing(true);
  
  const normalizedBlob = await normalizeImage(originalFile);
  const normalizedFile = new File(
    [normalizedBlob],
    'normalized_' + originalFile.name,
    { type: 'image/png' }
  );
  
  setPreviewUrl(URL.createObjectURL(normalizedBlob));
  setProcessing(false);
  
  // 可選：自動上傳處理後的圖片
  await uploadQuestionImage(normalizedFile, 'question', 0);
}
```

**套件安裝**：
```bash
npm install @techstark/opencv-js
```

**優化技巧**：
1. **Worker Thread**：放在 Web Worker 避免阻塞 UI
2. **Progressive Preview**：先低解析度預覽，再高解析度處理
3. **Lazy Load**：按需載入 OpenCV.js（~8MB）

---

### 方案 B：Cloud API - Google Cloud Vision

#### 優點
- ✅ 效果極佳：Google 級別算法
- ✅ 自動優化：包含去陰影、去摺痕

#### 缺點
- ❌ 費用：$1.50/1000 張
- ❌ 需要上傳：隱私問題

```typescript
// 僅供參考，不推薦
import vision from '@google-cloud/vision';

async function enhanceDocument(imageBuffer: Buffer) {
  const client = new vision.ImageAnnotatorClient();
  
  const [result] = await client.documentTextDetection({
    image: { content: imageBuffer },
    imageContext: {
      textDetectionParams: {
        enableTextDetectionConfidenceScore: true,
      },
    },
  });
  
  // 回傳處理後的圖片 + OCR 結果
  return result;
}
```

---

## 📝 功能 3：OCR 文字辨識

### 方案 A：Google Cloud Vision API（推薦 - 中文最佳 ⭐⭐⭐⭐⭐）

#### 優點
- ✅ 中文辨識率最高（支援繁中）
- ✅ 數學符號支援
- ✅ 版面分析（保留結構）

#### 缺點
- ❌ 費用：$1.50/1000 張（前 1000 張免費）

#### 實作方式

```typescript
// lib/ocr/google-vision.ts
import vision from '@google-cloud/vision';

export async function ocrImage(imageUrl: string) {
  const client = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });

  const [result] = await client.documentTextDetection(imageUrl);
  const fullText = result.fullTextAnnotation?.text || '';
  
  // 版面分析（保留段落結構）
  const pages = result.fullTextAnnotation?.pages || [];
  const blocks = pages[0]?.blocks || [];
  
  const structuredText = blocks.map(block => {
    const paragraphs = block.paragraphs || [];
    return paragraphs.map(para => {
      const words = para.words || [];
      return words.map(word => {
        const symbols = word.symbols || [];
        return symbols.map(s => s.text).join('');
      }).join(' ');
    }).join('\n');
  }).join('\n\n');

  return {
    text: fullText,
    structured: structuredText,
    confidence: result.fullTextAnnotation?.pages[0]?.confidence || 0,
  };
}
```

**費用計算**：
- 每月 1000 張免費額度
- 超過：$1.50/1000 張
- 估算：個人使用足夠免費

---

### 方案 B：Tesseract.js（推薦 - 免費方案 ⭐⭐⭐⭐）

#### 優點
- ✅ 完全免費
- ✅ 本地處理（隱私）
- ✅ 支援繁中

#### 缺點
- ❌ 準確率較低（約 85%）
- ❌ 數學符號支援差
- ❌ 速度慢（5-10 秒/張）

#### 實作方式

```typescript
// lib/ocr/tesseract.ts
import { createWorker } from 'tesseract.js';

export async function ocrImageLocal(imageUrl: string) {
  const worker = await createWorker('chi_tra'); // 繁體中文
  
  const { data: { text, confidence } } = await worker.recognize(imageUrl);
  
  await worker.terminate();
  
  return {
    text,
    confidence: confidence / 100, // 0-1
  };
}
```

**優化**：Worker Pool
```typescript
// 建立 Worker Pool 提升效能
import { createWorker } from 'tesseract.js';

class OCRWorkerPool {
  private workers: Tesseract.Worker[] = [];
  private queue: Array<() => void> = [];
  
  async init(poolSize = 2) {
    for (let i = 0; i < poolSize; i++) {
      const worker = await createWorker('chi_tra');
      this.workers.push(worker);
    }
  }
  
  async recognize(imageUrl: string) {
    const worker = await this.getAvailableWorker();
    return worker.recognize(imageUrl);
  }
  
  private async getAvailableWorker() {
    // 簡單實作，實際可用 Queue
    return this.workers[0];
  }
}
```

**套件安裝**：
```bash
npm install tesseract.js
```

---

### 方案 C：Azure Computer Vision（備選）

#### 優點
- ✅ 中文辨識率高
- ✅ 手寫文字支援

#### 缺點
- ❌ 費用較高：$1/1000 張

#### 實作方式

```typescript
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';

async function ocrWithAzure(imageUrl: string) {
  const client = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_KEY } }),
    process.env.AZURE_ENDPOINT!
  );

  const result = await client.read(imageUrl);
  // ... 處理結果
}
```

---

## 💡 其他建議功能

### 1. 🎯 智能裁切 - 自動框選題目區域

**技術**：邊緣檢測 + 文字區域分析

```typescript
// 自動裁切出題目區域（去除背景）
async function autoCapture(image: cv.Mat) {
  // 1. 邊緣檢測
  const edges = new cv.Mat();
  cv.Canny(image, edges, 50, 150);
  
  // 2. 尋找最大矩形輪廓
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
  // 3. 找最大矩形
  let maxArea = 0;
  let maxRect = null;
  
  for (let i = 0; i < contours.size(); i++) {
    const rect = cv.boundingRect(contours.get(i));
    const area = rect.width * rect.height;
    if (area > maxArea) {
      maxArea = area;
      maxRect = rect;
    }
  }
  
  // 4. 裁切
  const cropped = image.roi(maxRect);
  return cropped;
}
```

**使用場景**：
- 拍攝整頁試卷，自動框選單題
- 去除不必要的背景

---

### 2. 📐 透視校正 - 自動擺正傾斜/變形的圖片

**技術**：Perspective Transform

```typescript
async function deskew(image: cv.Mat) {
  // 1. 找四個角點
  const corners = detectCorners(image);
  
  // 2. 計算變換矩陣
  const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, corners.flat());
  const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    image.cols, 0,
    image.cols, image.rows,
    0, image.rows
  ]);
  
  const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
  
  // 3. 套用變換
  const corrected = new cv.Mat();
  cv.warpPerspective(image, corrected, M, image.size());
  
  return corrected;
}
```

**使用場景**：
- 斜拍的試卷
- 摺疊的紙張

---

### 3. 🖼️ 對比度增強 - 讓模糊的圖片更清晰

```typescript
function enhanceContrast(image: cv.Mat) {
  // CLAHE (Contrast Limited Adaptive Histogram Equalization)
  const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
  const enhanced = new cv.Mat();
  clahe.apply(image, enhanced);
  return enhanced;
}
```

---

### 4. 📊 批次處理 - 一次處理多張圖片

```typescript
async function batchProcess(files: File[]) {
  const results = await Promise.all(
    files.map(async (file) => {
      const normalized = await normalizeImage(file);
      const ocrResult = await ocrImage(normalized);
      return {
        originalFile: file,
        normalizedImage: normalized,
        extractedText: ocrResult.text,
      };
    })
  );
  return results;
}
```

---

### 5. 🔍 即時預覽 - Before/After 對比

```typescript
// 使用 Slider 對比原圖和處理後
function ImageComparison({ before, after }: { before: string; after: string }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  
  return (
    <div className="relative">
      <img src={after} className="w-full" />
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img src={before} className="w-full" />
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={(e) => setSliderPosition(Number(e.target.value))}
      />
    </div>
  );
}
```

---

### 6. 💾 處理歷史記錄 - 可還原到原圖

```typescript
interface ProcessingHistory {
  original: string;
  steps: Array<{
    name: 'normalize' | 'remove_ink' | 'ocr';
    result: string;
    timestamp: Date;
  }>;
}

// 可以隨時回退到任一步驟
```

---

## 🎯 推薦方案組合

### 💎 方案 1：完整 AI 版（最佳體驗，有成本）

| 功能 | 技術方案 | 月成本估算 |
|------|---------|-----------|
| 移除筆跡 | Replicate Inpainting | $5 (500 張) |
| 白底黑字 | OpenCV.js (免費) | $0 |
| OCR | Google Vision API | $0 (免費額度) |
| **總計** | | **$5/月** |

**特點**：
- ✅ 效果最好
- ✅ 自動化程度高
- ⚠️ 需要 API 金鑰管理

---

### 🥈 方案 2：混合版（推薦 - 平衡性價比）

| 功能 | 技術方案 | 月成本 |
|------|---------|--------|
| 移除筆跡 | 手動 Eraser Tool | $0 |
| 白底黑字 | OpenCV.js | $0 |
| OCR | Tesseract.js | $0 |
| **總計** | | **$0** |

**特點**：
- ✅ 完全免費
- ✅ 本地處理（隱私好）
- ⚠️ 移除筆跡需手動
- ⚠️ OCR 準確率 85%

---

### 🥉 方案 3：漸進式（先做核心，逐步升級）

**Phase 2D-1**（立即實作）：
- ✅ 白底黑字標準化（OpenCV.js）
- ✅ OCR 文字辨識（Tesseract.js）

**Phase 2D-2**（未來升級）：
- 🔄 手動 Eraser Tool
- 🔄 Google Vision API（當 Tesseract 不夠用）

**Phase 2D-3**（終極版）：
- 🔄 AI Inpainting（Replicate）
- 🔄 自動筆跡檢測

---

## 📦 實作架構

### 資料夾結構

```
lib/
├── image-processing/
│   ├── normalize.ts          # 白底黑字標準化
│   ├── eraser.ts              # 手動擦除工具
│   ├── deskew.ts              # 透視校正
│   └── enhance.ts             # 對比度增強
├── ocr/
│   ├── tesseract.ts           # Tesseract.js OCR
│   ├── google-vision.ts       # Google Vision API
│   └── worker-pool.ts         # OCR Worker Pool
└── ai/
    └── inpainting.ts          # AI 移除筆跡

components/
├── questions/
│   ├── ImagePreprocessor.tsx  # 圖片前處理元件
│   ├── EraserTool.tsx         # 筆跡擦除工具
│   ├── OCRButton.tsx          # OCR 觸發按鈕
│   └── ProcessingHistory.tsx  # 處理歷史記錄
└── ui/
    └── image-comparison.tsx   # Before/After 對比

app/api/
├── ocr/
│   └── route.ts               # OCR API (Google Vision)
└── inpainting/
    └── route.ts               # AI 修復 API (Replicate)
```

---

## 🚀 實作順序建議

### Week 1：基礎設施
1. ✅ 安裝 OpenCV.js 和 Tesseract.js
2. ✅ 建立 ImagePreprocessor 元件
3. ✅ 實作白底黑字標準化
4. ✅ 即時預覽功能

### Week 2：OCR 整合
1. ✅ Tesseract.js OCR 實作
2. ✅ OCR 結果自動填入表單
3. ✅ 編輯 OCR 結果功能
4. ✅ 信心度顯示

### Week 3：進階功能
1. ✅ 手動 Eraser Tool
2. ✅ 透視校正
3. ✅ 批次處理
4. ✅ 處理歷史記錄

### Week 4（可選）：AI 升級
1. 🔄 Replicate API 整合
2. 🔄 AI Inpainting
3. 🔄 自動筆跡檢測

---

## 💰 成本分析

### 免費方案（方案 2）
- OpenCV.js: $0
- Tesseract.js: $0
- **總計: $0/月**

### 付費方案（方案 1）
假設每月使用量：
- 新增 100 道錯題
- 每題平均 2 張圖
- 總計 200 張圖片

| 項目 | 單價 | 數量 | 月費 |
|------|------|------|------|
| Google Vision OCR | $1.50/1000 | 200 張 | $0.30 |
| Replicate Inpainting | $0.01/張 | 100 張 | $1.00 |
| **總計** | | | **$1.30/月** |

---

## 📊 效果對比

| 項目 | Tesseract.js | Google Vision |
|------|--------------|---------------|
| 中文準確率 | 85% | 98% |
| 數學符號 | ❌ 差 | ✅ 好 |
| 速度 | 5-10 秒 | 2-3 秒 |
| 費用 | 免費 | $1.50/1000 |
| 隱私 | ✅ 本地 | ⚠️ 上傳 |

---

## 🎯 我的建議

### 初期實作（推薦方案 2）
1. ✅ **白底黑字標準化** - OpenCV.js（必做）
2. ✅ **OCR 文字辨識** - Tesseract.js（必做）
3. ✅ **手動 Eraser Tool** - Canvas API（必做）

**理由**：
- 完全免費
- 本地處理，隱私好
- 涵蓋 80% 使用場景
- 實作難度適中

### 未來升級（視使用者反饋）
- 如果 Tesseract 準確率不夠 → 升級到 Google Vision
- 如果手動擦除太麻煩 → 升級到 AI Inpainting
- 如果需要數學公式識別 → Mathpix API

---

## ❓ 討論問題

請告訴我：
1. **預算**：是否接受月費 $1-5 USD？還是希望完全免費？
2. **優先級**：三個功能中哪個最重要？
3. **使用場景**：
   - 主要是彩色筆跡還是鉛筆？
   - 圖片品質如何（清晰/模糊）？
   - 有數學公式嗎？
4. **時程**：希望多久完成？

根據您的回答，我會幫您選擇最適合的方案並開始實作！🚀
