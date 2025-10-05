// ============================================
// Step3Folders - 錯題新增步驟 3：選擇資料夾
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getFolders } from '@/lib/api/folder.api';
import type { FolderTreeNode } from '@/types/folder.types';
import type { CreateQuestionInput } from '@/types/question.types';
import { ChevronRight, ChevronDown, Folder as FolderIcon } from 'lucide-react';

interface Step3FoldersProps {
  control: Control<CreateQuestionInput>;
  setValue: UseFormSetValue<CreateQuestionInput>;
  defaultFolderId?: string; // 預設選中的資料夾 ID
}

export function Step3Folders({ control, setValue, defaultFolderId }: Step3FoldersProps) {
  const [folders, setFolders] = useState<FolderTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // 載入資料夾樹
  useEffect(() => {
    async function loadFolders() {
      try {
        const data = await getFolders({ include_children: true }) as FolderTreeNode[];
        setFolders(data);
        
        // 如果有預設資料夾，展開其父資料夾路徑
        if (defaultFolderId) {
          expandToFolder(data, defaultFolderId);
          // 自動選中預設資料夾
          setValue('folder_ids', [defaultFolderId]);
        }
      } catch (error) {
        console.error('載入資料夾失敗:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFolders();
  }, [defaultFolderId, setValue]);

  // 展開到指定資料夾的路徑
  const expandToFolder = (tree: FolderTreeNode[], targetId: string) => {
    const newExpanded = new Set<string>();
    
    function findPath(nodes: FolderTreeNode[], id: string, path: string[]): boolean {
      for (const node of nodes) {
        if (node.id === id) {
          path.forEach(pid => newExpanded.add(pid));
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (findPath(node.children, id, [...path, node.id])) {
            return true;
          }
        }
      }
      return false;
    }

    findPath(tree, targetId, []);
    setExpandedIds(newExpanded);
  };

  // 切換展開/收合
  const toggleExpand = (folderId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // 遞迴渲染資料夾樹
  const renderFolderTree = (
    nodes: FolderTreeNode[],
    selectedIds: string[],
    onToggle: (folderId: string, checked: boolean) => void,
    depth: number = 0
  ) => {
    return nodes.map((folder) => {
      const isExpanded = expandedIds.has(folder.id);
      const hasChildren = folder.children && folder.children.length > 0;
      const isChecked = selectedIds.includes(folder.id);
      const indent = depth * 28; // 每層縮排 28px

      return (
        <div key={folder.id} className="space-y-1">
          <div
            className="flex items-center gap-2 py-2 px-2 hover:bg-gray-50 rounded-md transition-colors"
            style={{ paddingLeft: `${indent + 8}px` }}
          >
            {/* 展開/收合按鈕 */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(folder.id)}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}

            {/* Checkbox */}
            <Checkbox
              id={folder.id}
              checked={isChecked}
              onCheckedChange={(checked: boolean) => onToggle(folder.id, checked)}
            />

            {/* 資料夾資訊 */}
            <label
              htmlFor={folder.id}
              className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
            >
              <FolderIcon className="h-4 w-4 text-blue-500" />
              <span className={isChecked ? 'font-medium text-blue-600' : ''}>
                {folder.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                Level {folder.level}
              </Badge>
            </label>
          </div>

          {/* 遞迴渲染子資料夾 */}
          {hasChildren && isExpanded && (
            <div>
              {renderFolderTree(folder.children!, selectedIds, onToggle, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>尚未建立任何資料夾</p>
        <p className="text-sm mt-2">請先在左側建立資料夾</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="folder_ids"
        render={({ field }) => {
          const handleToggle = (folderId: string, checked: boolean) => {
            const currentIds = field.value || [];
            if (checked) {
              field.onChange([...currentIds, folderId]);
            } else {
              field.onChange(currentIds.filter(id => id !== folderId));
            }
          };

          const selectedIds = field.value || [];

          return (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                選擇資料夾 <span className="text-red-500">*</span>
                <span className="text-gray-400 text-sm font-normal">(可多選)</span>
              </FormLabel>
              <FormControl>
                <ScrollArea className="h-[300px] border rounded-md p-2 bg-white">
                  {renderFolderTree(folders, selectedIds, handleToggle)}
                </ScrollArea>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {/* 已選擇的資料夾列表 */}
      <FormField
        control={control}
        name="folder_ids"
        render={({ field }) => {
          const selectedIds = field.value || [];
          
          if (selectedIds.length === 0) {
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-700">
                ⚠️ 請至少選擇一個資料夾
              </div>
            );
          }

          // 找出選中的資料夾名稱
          const getSelectedFolderNames = (tree: FolderTreeNode[], ids: string[]): string[] => {
            const names: string[] = [];
            
            function search(nodes: FolderTreeNode[]) {
              for (const node of nodes) {
                if (ids.includes(node.id)) {
                  names.push(node.name);
                }
                if (node.children) {
                  search(node.children);
                }
              }
            }
            
            search(tree);
            return names;
          };

          const selectedNames = getSelectedFolderNames(folders, selectedIds);

          return (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm font-medium text-blue-900 mb-2">
                ✓ 已選擇 {selectedIds.length} 個資料夾：
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedNames.map((name, index) => (
                  <Badge key={index} variant="default" className="bg-blue-600">
                    {name}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                💡 這題會出現在所有選中的資料夾中
              </p>
            </div>
          );
        }}
      />
    </div>
  );
}
