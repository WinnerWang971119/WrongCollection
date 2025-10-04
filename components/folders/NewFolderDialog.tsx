// ============================================
// NewFolderDialog Component - 新增資料夾對話框
// 說明：用於建立新資料夾（根資料夾或子資料夾）
// ============================================

'use client';

import { useState } from 'react';
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
import { createFolderSchema } from '@/lib/validations/folder.validation';
import { createFolder } from '@/lib/api/folder.api';
import type { CreateFolderInput } from '@/types/folder.types';
import { z } from 'zod';

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
  parentName?: string | null;
  onSuccess: () => void;
}

export function NewFolderDialog({
  open,
  onOpenChange,
  parentId = null,
  parentName = null,
  onSuccess,
}: NewFolderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof createFolderSchema>>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: '',
      parent_id: parentId,
    },
  });

  const onSubmit = async (data: CreateFolderInput) => {
    try {
      setIsSubmitting(true);
      await createFolder(data);
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating folder:', error);
      form.setError('name', {
        message: error instanceof Error ? error.message : '建立資料夾失敗',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新增資料夾</DialogTitle>
          <DialogDescription>
            {parentName ? (
              <>
                在 <span className="font-semibold text-blue-600">{parentName}</span> 下建立子資料夾
              </>
            ) : (
              '建立新的根資料夾'
            )}
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
                      placeholder="例如：數學、代數、一元二次方程式"
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
                建立
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
