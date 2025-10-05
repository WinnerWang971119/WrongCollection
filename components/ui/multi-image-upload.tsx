// ============================================
// MultiImageUpload - 多圖上傳元件
// 功能：支援最多 2 張圖片、拖曳上傳、預覽、刪除、排序
// ============================================

'use client';

import { useState, useRef, DragEvent, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { validateImageFile } from '@/lib/supabase/storage';
import { uploadQuestionImage } from '@/lib/api/image.api';

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  uploading?: boolean;
  uploaded?: boolean;
  path?: string;
}

interface MultiImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  label?: string;
  helperText?: string;
  imageType?: 'question' | 'explanation'; // 新增：圖片類型
}

export function MultiImageUpload({
  images,
  onImagesChange,
  maxImages = 2,
  label = '圖片上傳',
  helperText = '支援 JPG、PNG、WEBP 格式，單檔最大 5MB',
  imageType = 'question',
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自動上傳新選擇的圖片
  useEffect(() => {
    const uploadPendingImages = async () => {
      const pendingImages = images.filter(img => !img.uploading && !img.uploaded && !img.path);
      
      if (pendingImages.length === 0) return;

      console.log(`🚀 開始上傳 ${pendingImages.length} 張圖片...`);

      for (const imageFile of pendingImages) {
        const index = images.findIndex(img => img.id === imageFile.id);
        
        try {
          // 設置上傳中狀態
          const updatedImages = [...images];
          updatedImages[index] = { ...imageFile, uploading: true };
          onImagesChange(updatedImages);

          console.log(`📤 上傳圖片 ${index + 1}/${pendingImages.length}:`, imageFile.file.name);

          // 呼叫上傳 API
          const result = await uploadQuestionImage(imageFile.file, imageType, index);

          console.log(`✅ 上傳成功:`, result);

          // 更新為上傳成功狀態
          const successImages = [...images];
          successImages[index] = {
            ...imageFile,
            uploading: false,
            uploaded: true,
            path: result.path,
          };
          onImagesChange(successImages);

          toast.success(`圖片 ${index + 1} 上傳成功`);
        } catch (error) {
          console.error(`❌ 上傳失敗:`, error);

          // 更新為上傳失敗狀態
          const failedImages = [...images];
          failedImages[index] = { ...imageFile, uploading: false, uploaded: false };
          onImagesChange(failedImages);

          toast.error(`圖片 ${index + 1} 上傳失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
        }
      }
    };

    uploadPendingImages();
  }, [images, imageType, onImagesChange]);

  // 處理檔案選擇
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const remainingSlots = maxImages - images.length;

    if (filesArray.length > remainingSlots) {
      toast.error(`最多只能上傳 ${maxImages} 張圖片`);
      return;
    }

    const validFiles: ImageFile[] = [];

    for (const file of filesArray) {
      // 驗證檔案
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || '無效的圖片檔案');
        continue;
      }

      // 生成預覽
      const preview = URL.createObjectURL(file);
      const imageFile: ImageFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview,
        uploading: false,
        uploaded: false,
      };

      validFiles.push(imageFile);
    }

    if (validFiles.length > 0) {
      onImagesChange([...images, ...validFiles]);
      toast.success(`已選擇 ${validFiles.length} 張圖片`);
    }
  };

  // 點擊上傳按鈕
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 刪除圖片
  const handleRemove = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange(images.filter((img) => img.id !== id));
    toast.success('已移除圖片');
  };

  // 拖曳進入
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // 拖曳離開
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // 拖曳經過
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 放下檔案
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-3">
      {/* 標籤 */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {label}
            <span className="text-gray-500 ml-2">
              ({images.length}/{maxImages})
            </span>
          </label>
        </div>
      )}

      {/* 圖片預覽網格 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((image) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video relative bg-gray-100">
                  <img
                    src={image.preview}
                    alt="預覽"
                    className="w-full h-full object-cover"
                  />
                  {/* 上傳中遮罩 */}
                  {image.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                  {/* 刪除按鈕 */}
                  <button
                    onClick={() => handleRemove(image.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    disabled={image.uploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {/* 已上傳標記 */}
                  {image.uploaded && (
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      ✓ 已上傳
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 上傳區域 */}
      {canAddMore && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
          onClick={handleUploadClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2">
            {isDragging ? (
              <>
                <Upload className="h-10 w-10 text-blue-500" />
                <p className="text-sm font-medium text-blue-600">
                  放開以上傳圖片
                </p>
              </>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  點擊或拖曳圖片到這裡
                </p>
                <p className="text-xs text-gray-500">{helperText}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* 提示訊息 */}
      {!canAddMore && (
        <p className="text-sm text-gray-500 text-center">
          已達到最大圖片數量 ({maxImages} 張)
        </p>
      )}
    </div>
  );
}
