// ============================================
// DeleteFolderDialog Component - 刪除資料夾確認對話框
// 說明：用於確認刪除資料夾（含安全檢查）
// ============================================

'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { deleteFolder } from '@/lib/api/folder.api';
import type { FolderTreeNode } from '@/types/folder.types';

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: FolderTreeNode | null;
  onSuccess: () => void;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folder,
  onSuccess,
}: DeleteFolderDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChildren = folder?.children && folder.children.length > 0;

  const handleDelete = async (force = false) => {
    if (!folder) return;

    try {
      setIsDeleting(true);
      setError(null);
      await deleteFolder(folder.id, force);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError(err instanceof Error ? err.message : '刪除資料夾失敗');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!folder) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            刪除資料夾
            <Badge variant="destructive" className="text-xs">
              Level {folder.level}
            </Badge>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              確定要刪除資料夾{' '}
              <span className="font-semibold text-gray-900">{folder.name}</span>{' '}
              嗎？
            </p>
            
            {hasChildren && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ 此資料夾包含 {folder.children.length} 個子資料夾
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  刪除後將無法復原，所有子資料夾及其內容也會一併刪除。
                </p>
              </div>
            )}

            <p className="text-sm text-gray-600">
              路徑：{folder.path || folder.name}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            取消
          </Button>
          
          {hasChildren ? (
            <Button
              variant="destructive"
              onClick={() => handleDelete(true)}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認刪除（包含子資料夾）
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => handleDelete(false)}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認刪除
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
