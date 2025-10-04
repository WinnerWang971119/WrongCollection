// ============================================
// EditFolderDialog Component - 編輯資料夾對話框
// 說明：用於更新資料夾名稱
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateFolderSchema } from '@/lib/validations/folder.validation';
import { updateFolder } from '@/lib/api/folder.api';
import type { UpdateFolderInput, FolderTreeNode } from '@/types/folder.types';
import { z } from 'zod';

interface EditFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: FolderTreeNode | null;
  onSuccess: () => void;
}

export function EditFolderDialog({
  open,
  onOpenChange,
  folder,
  onSuccess,
}: EditFolderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof updateFolderSchema>>({
    resolver: zodResolver(updateFolderSchema),
    defaultValues: {
      name: folder?.name || '',
    },
  });

  // 當 folder 改變時更新表單
  useEffect(() => {
    if (folder) {
      form.reset({ name: folder.name });
    }
  }, [folder, form]);

  const onSubmit = async (data: UpdateFolderInput) => {
    if (!folder) return;

    try {
      setIsSubmitting(true);
      await updateFolder(folder.id, data);
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating folder:', error);
      form.setError('name', {
        message: error instanceof Error ? error.message : '更新資料夾失敗',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!folder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            編輯資料夾
            <Badge variant="secondary" className="text-xs">
              Level {folder.level}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            修改資料夾名稱（路徑：{folder.path || folder.name}）
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>資料夾名稱</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="輸入新名稱"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                儲存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
