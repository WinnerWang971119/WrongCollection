-- ============================================
-- WrongCollection - Folders Table Migration
-- 創建時間: 2025-10-04
-- 說明: 建立資料夾資料表，支援最多 4 層階層結構
-- ============================================

-- 1. 創建 folders 資料表
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- 確保同一使用者下，同層資料夾名稱不重複
  CONSTRAINT unique_folder_name_per_parent UNIQUE (user_id, parent_id, name)
);

-- 2. 添加註解
COMMENT ON TABLE public.folders IS '資料夾資料表，支援最多 4 層階層結構';
COMMENT ON COLUMN public.folders.id IS '資料夾唯一識別碼';
COMMENT ON COLUMN public.folders.user_id IS '擁有者 ID，關聯到 auth.users';
COMMENT ON COLUMN public.folders.name IS '資料夾名稱，1-50 字元';
COMMENT ON COLUMN public.folders.parent_id IS '父資料夾 ID，NULL 表示根資料夾';
COMMENT ON COLUMN public.folders.level IS '資料夾層級，1=根資料夾，最多到 4';
COMMENT ON COLUMN public.folders.created_at IS '創建時間';
COMMENT ON COLUMN public.folders.updated_at IS '最後更新時間';

-- 3. 創建索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_level ON public.folders(level);
CREATE INDEX IF NOT EXISTS idx_folders_user_parent ON public.folders(user_id, parent_id);

-- 4. 創建 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION public.update_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_folders_updated_at();

-- 5. 創建函數：驗證資料夾層級（防止超過 4 層）
CREATE OR REPLACE FUNCTION public.validate_folder_level()
RETURNS TRIGGER AS $$
DECLARE
  parent_level INTEGER;
BEGIN
  -- 如果是根資料夾（parent_id 為 NULL）
  IF NEW.parent_id IS NULL THEN
    IF NEW.level != 1 THEN
      RAISE EXCEPTION '根資料夾的 level 必須為 1';
    END IF;
    RETURN NEW;
  END IF;

  -- 取得父資料夾的層級
  SELECT level INTO parent_level 
  FROM public.folders 
  WHERE id = NEW.parent_id AND user_id = NEW.user_id;

  -- 檢查父資料夾是否存在
  IF parent_level IS NULL THEN
    RAISE EXCEPTION '父資料夾不存在或不屬於該使用者';
  END IF;

  -- 檢查父資料夾是否已達最大層級
  IF parent_level >= 4 THEN
    RAISE EXCEPTION '無法在第 4 層資料夾下創建子資料夾';
  END IF;

  -- 設定正確的層級
  NEW.level := parent_level + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_folder_level
  BEFORE INSERT OR UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_folder_level();

-- 6. 啟用 Row Level Security (RLS)
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- 7. 創建 RLS 政策：使用者只能操作自己的資料夾
-- 查詢政策
CREATE POLICY "Users can view own folders"
  ON public.folders
  FOR SELECT
  USING (auth.uid() = user_id);

-- 新增政策
CREATE POLICY "Users can create own folders"
  ON public.folders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 更新政策
CREATE POLICY "Users can update own folders"
  ON public.folders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 刪除政策
CREATE POLICY "Users can delete own folders"
  ON public.folders
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. 創建輔助函數：取得資料夾樹狀結構（遞迴查詢）
CREATE OR REPLACE FUNCTION public.get_folder_tree(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  parent_id UUID,
  level INTEGER,
  path TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_tree AS (
    -- 根節點（第一層資料夾）
    SELECT 
      f.id,
      f.name,
      f.parent_id,
      f.level,
      f.name::TEXT AS path,
      f.created_at
    FROM public.folders f
    WHERE f.user_id = p_user_id AND f.parent_id IS NULL
    
    UNION ALL
    
    -- 遞迴查詢子資料夾
    SELECT 
      f.id,
      f.name,
      f.parent_id,
      f.level,
      ft.path || ' > ' || f.name AS path,
      f.created_at
    FROM public.folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
    WHERE f.user_id = p_user_id
  )
  SELECT * FROM folder_tree
  ORDER BY path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 創建輔助函數：檢查資料夾是否有子資料夾
CREATE OR REPLACE FUNCTION public.has_subfolders(p_folder_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subfolder_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subfolder_count
  FROM public.folders
  WHERE parent_id = p_folder_id;
  
  RETURN subfolder_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 創建輔助函數：取得資料夾路徑（麵包屑）
CREATE OR REPLACE FUNCTION public.get_folder_path(p_folder_id UUID)
RETURNS TEXT AS $$
DECLARE
  folder_path TEXT;
BEGIN
  WITH RECURSIVE path_builder AS (
    SELECT id, name, parent_id, name::TEXT AS path
    FROM public.folders
    WHERE id = p_folder_id
    
    UNION ALL
    
    SELECT f.id, f.name, f.parent_id, f.name || ' > ' || pb.path
    FROM public.folders f
    INNER JOIN path_builder pb ON f.id = pb.parent_id
  )
  SELECT path INTO folder_path
  FROM path_builder
  WHERE parent_id IS NULL;
  
  RETURN folder_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 測試資料（可選，供開發測試使用）
-- ============================================
-- 注意：實際使用時請註解掉以下測試資料

-- 插入測試資料夾（需要有效的 user_id）
-- INSERT INTO public.folders (user_id, name, parent_id, level) VALUES
-- ('your-user-id-here', '數學', NULL, 1),
-- ('your-user-id-here', '英文', NULL, 1);

-- ============================================
-- Migration 完成
-- ============================================
-- 執行此檔案後，請確認：
-- 1. folders 資料表已創建
-- 2. 所有索引已建立
-- 3. RLS 政策已啟用
-- 4. 觸發器正常運作
-- 
-- 測試建議：
-- 1. 嘗試新增根資料夾（level = 1）
-- 2. 嘗試新增子資料夾（驗證 level 自動設定）
-- 3. 嘗試在第 4 層下新增子資料夾（應該失敗）
-- ============================================
