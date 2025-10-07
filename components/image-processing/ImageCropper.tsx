'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Scissors, RotateCcw, RotateCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [verticalPerspective, setVerticalPerspective] = useState<number>(0);   // 垂直透視 (-50 ~ 50, 正值=上窄下寬)
  const [horizontalPerspective, setHorizontalPerspective] = useState<number>(0); // 水平透視 (-50 ~ 50, 正值=左窄右寬)
  const imgRef = useRef<HTMLImageElement>(null);
  const originalImgRef = useRef<HTMLImageElement>(null);  // 原始圖片引用（隱藏）
  const [cropping, setCropping] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);  // 預覽圖片 URL
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理預覽 URL（避免記憶體洩漏）
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 重置所有調整
  const handleReset = () => {
    setCrop({
      unit: '%',
      width: 80,
      height: 80,
      x: 10,
      y: 10,
    });
    setCompletedCrop(null);
    setRotation(0);
    setVerticalPerspective(0);
    setHorizontalPerspective(0);
    setPreviewUrl(null);  // 重置預覽
  };

  // 快速旋轉
  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // 即時預覽（放開滑桿時執行）
  const handlePreview = () => {
    performPerspectiveTransform(true);
  };

  // 執行裁切、旋轉和透視校正
  const handleCrop = async () => {
    await performPerspectiveTransform(false);
  };

  // 透視變換核心函數
  const performPerspectiveTransform = async (isPreview: boolean = false) => {
    // ✅ 使用原始圖片，而不是預覽圖片
    if (!originalImgRef.current) return;
    
    if (isPreview) {
      setPreviewing(true);
    } else {
      setCropping(true);
    }
    
    try {
      console.log('🔧 開始處理圖片...');
      console.log('📊 透視參數:', { verticalPerspective, horizontalPerspective });
      console.log('📊 旋轉角度:', rotation);
      
      // 動態載入 OpenCV
      console.log('📦 載入 OpenCV...');
      const { loadOpenCV } = await import('@/lib/image-processing/opencv-loader');
      const cv = await loadOpenCV();
      console.log('✅ OpenCV 載入完成');

      // ✅ 從原始圖片讀取像素
      const originalImage = originalImgRef.current;
      
      // 準備 Canvas 和 OpenCV Mat
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // 🆕 預覽模式：使用整張圖片（不裁切）
      if (isPreview) {
        console.log('👁️ 預覽模式：透視變換整張圖片');
        canvas.width = originalImage.naturalWidth;
        canvas.height = originalImage.naturalHeight;
        ctx.drawImage(originalImage, 0, 0);
      } 
      // 🆕 確認模式：先裁切，再透視
      else {
        const displayImage = imgRef.current;
        if (!displayImage) return;
        
        const scaleX = originalImage.naturalWidth / displayImage.width;
        const scaleY = originalImage.naturalHeight / displayImage.height;

        let sourceWidth = originalImage.naturalWidth;
        let sourceHeight = originalImage.naturalHeight;
        let sourceX = 0;
        let sourceY = 0;

        // 如果有裁切，使用裁切區域
        if (completedCrop) {
          sourceX = completedCrop.x * scaleX;
          sourceY = completedCrop.y * scaleY;
          sourceWidth = completedCrop.width * scaleX;
          sourceHeight = completedCrop.height * scaleY;
          console.log('✂️ 裁切區域:', { sourceX, sourceY, sourceWidth, sourceHeight });
          console.log('📏 比例:', { scaleX, scaleY });
        }

        console.log('✂️ 執行裁切...');
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        ctx.drawImage(originalImage, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
      }

      // 讀取到 OpenCV Mat
      console.log('📖 讀取圖片到 OpenCV Mat...');
      const src = cv.imread(canvas);
      console.log('✅ 讀取完成，尺寸:', src.cols, 'x', src.rows);

      // === Step 1: 透視變換 ===
      let processed = src;
      if (verticalPerspective !== 0 || horizontalPerspective !== 0) {
        console.log('🔄 執行透視變換...');
        const width = src.cols;
        const height = src.rows;

        // 原始四個角點
        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,           // 左上
          width, 0,       // 右上
          width, height,  // 右下
          0, height       // 左下
        ]);

        // 計算透視後的四個角點（簡化版：一個參數控制對稱變形）
        const topOffset = (-verticalPerspective / 100) * width;      // 上邊（負值）
        const bottomOffset = (verticalPerspective / 100) * width;    // 下邊（正值）
        const leftOffset = (-horizontalPerspective / 100) * height;  // 左邊（負值）
        const rightOffset = (horizontalPerspective / 100) * height;  // 右邊（正值）

        console.log('📐 偏移量:', { topOffset, bottomOffset, leftOffset, rightOffset });

        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0 + topOffset, 0 + leftOffset,                    // 左上
          width - topOffset, 0 + rightOffset,               // 右上
          width - bottomOffset, height - rightOffset,       // 右下
          0 + bottomOffset, height - leftOffset             // 左下
        ]);

        // 計算透視變換矩陣
        console.log('🔢 計算透視變換矩陣...');
        const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
        const perspectiveResult = new cv.Mat();
        console.log('🎨 應用透視變換...');
        cv.warpPerspective(src, perspectiveResult, M, new cv.Size(width, height));

        srcPoints.delete();
        dstPoints.delete();
        M.delete();
        
        // 刪除原始圖片，使用透視後的結果
        src.delete();
        processed = perspectiveResult;
        console.log('✅ 透視變換完成');
      }

      // === Step 2: 旋轉 ===
      let final = processed;
      if (rotation !== 0) {
        console.log('🔄 執行旋轉:', rotation, '度');
        const center = new cv.Point(processed.cols / 2, processed.rows / 2);
        const M = cv.getRotationMatrix2D(center, rotation, 1.0);
        
        // 計算旋轉後的畫布大小
        const radians = (Math.abs(rotation) * Math.PI) / 180;
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));
        const newWidth = Math.ceil(processed.cols * cos + processed.rows * sin);
        const newHeight = Math.ceil(processed.cols * sin + processed.rows * cos);
        
        console.log('📏 新尺寸:', newWidth, 'x', newHeight);
        
        // 調整旋轉矩陣的位移
        M.doublePtr(0, 2)[0] += (newWidth / 2) - center.x;
        M.doublePtr(1, 2)[0] += (newHeight / 2) - center.y;
        
        final = new cv.Mat();
        cv.warpAffine(processed, final, M, new cv.Size(newWidth, newHeight), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255));
        
        M.delete();
        processed.delete();
        console.log('✅ 旋轉完成');
      }

      // 輸出到 Canvas
      console.log('🖼️ 輸出到 Canvas...');
      const outputCanvas = document.createElement('canvas');
      cv.imshow(outputCanvas, final);
      final.delete();
      console.log('✅ 輸出完成');

      // 轉換為 Blob
      console.log('💾 轉換為 Blob...');
      const blob = await new Promise<Blob>((resolve, reject) => {
        outputCanvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('✅ Blob 轉換成功，大小:', blob.size, 'bytes');
              resolve(blob);
            }
            else reject(new Error('Canvas to Blob failed'));
          },
          'image/png'
        );
      });

      console.log('🎉 處理完成！');
      
      if (isPreview) {
        // 預覽模式：更新預覽圖片 URL
        // 先清理舊的 URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        console.log('🖼️ 預覽 URL 已更新');
      } else {
        // 確認模式：回調完成
        onCropComplete(blob);
      }
    } catch (error) {
      console.error('❌ 處理失敗:', error);
      console.error('❌ 錯誤堆疊:', error instanceof Error ? error.stack : 'No stack trace');
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!isPreview) {
        alert('處理失敗：' + errorMessage);
      }
    } finally {
      if (isPreview) {
        setPreviewing(false);
      } else {
        setCropping(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 隱藏的原始圖片（用於讀取原始像素） */}
      <img
        ref={originalImgRef}
        src={imageUrl}
        alt="原始圖片"
        style={{ display: 'none' }}
      />
      
      {/* 裁切和變形區域 */}
      <div className="border rounded-lg overflow-hidden bg-gray-50">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={undefined}
        >
          <img
            ref={imgRef}
            src={previewUrl || imageUrl}
            alt="待調整圖片"
            style={{ maxHeight: '500px', width: '100%', objectFit: 'contain' }}
          />
        </ReactCrop>
      </div>

      {/* 控制面板 */}
      <div className="space-y-3">
        {/* 旋轉控制 */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">🔄 旋轉角度</label>
            <span className="text-sm text-blue-600 font-mono">{rotation}°</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRotateLeft}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              -90°
            </Button>
            
            <Slider
              value={[rotation]}
              onValueChange={(value) => setRotation(value[0])}
              min={-180}
              max={180}
              step={1}
              className="flex-1"
            />
            
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRotateRight}
              className="flex items-center gap-1"
            >
              <RotateCw className="h-4 w-4" />
              +90°
            </Button>
          </div>
        </div>

        {/* 垂直透視控制（上下變形） */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">↕️ 垂直透視</label>
            <span className="text-sm text-green-600 font-mono">{verticalPerspective > 0 ? '+' : ''}{verticalPerspective}</span>
          </div>
          
          <Slider
            value={[verticalPerspective]}
            onValueChange={(value) => setVerticalPerspective(value[0])}
            onValueCommit={handlePreview}
            min={-50}
            max={50}
            step={1}
            className="flex-1"
          />
          <div className="text-xs text-gray-600 space-y-1">
            <p>• <strong>正值 (+)</strong>：上窄下寬（從下往上拍時使用）</p>
            <p>• <strong>負值 (-)</strong>：上寬下窄（從上往下拍時使用）</p>
          </div>
        </div>

        {/* 水平透視控制（左右變形） */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">↔️ 水平透視</label>
            <span className="text-sm text-purple-600 font-mono">{horizontalPerspective > 0 ? '+' : ''}{horizontalPerspective}</span>
          </div>
          
          <Slider
            value={[horizontalPerspective]}
            onValueChange={(value) => setHorizontalPerspective(value[0])}
            onValueCommit={handlePreview}
            min={-50}
            max={50}
            step={1}
            className="flex-1"
          />
          <div className="text-xs text-gray-600 space-y-1">
            <p>• <strong>正值 (+)</strong>：左窄右寬（從左側拍時使用）</p>
            <p>• <strong>負值 (-)</strong>：左寬右窄（從右側拍時使用）</p>
          </div>
        </div>
      </div>

      {/* 處理狀態指示器 */}
      {previewing && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-600">⏳ 正在計算預覽...</span>
        </div>
      )}

      {/* 說明文字 */}
      <div className="text-sm text-gray-600 space-y-1 p-3 bg-gray-50 rounded-lg">
        <p>📌 <strong>裁切：</strong>拖曳藍色框線調整裁切區域（可選）</p>
        <p>📌 <strong>旋轉：</strong>調整圖片平面旋轉角度</p>
        <p>📌 <strong>垂直透視：</strong>一個滑桿控制上下對稱變形</p>
        <p>📌 <strong>水平透視：</strong>一個滑桿控制左右對稱變形</p>
        <p className="text-xs text-blue-600 mt-2">💡 放開滑桿後自動計算預覽（使用原始圖片，不累加）</p>
      </div>

      {/* 操作按鈕 */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          重置
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleCrop}
            disabled={cropping}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Scissors className="h-4 w-4" />
            {cropping ? '處理中...' : '確認調整'}
          </Button>
        </div>
      </div>
    </div>
  );
}
