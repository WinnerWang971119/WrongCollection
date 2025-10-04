-- ============================================
-- Migration 002: 建立錯題系統資料表
-- ============================================
-- 說明：
--   1. questions 表：儲存錯題的核心資料
--   2. question_folders 表：多對多關聯（錯題 ↔ 資料夾）
--   3. RLS 政策：確保資料安全
--   4. 索引：優化查詢效能
-- ============================================

-- ============================================
-- 1. 建立 questions 表
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  -- 基本資訊
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 步驟 1：基本資訊
  title VARCHAR(100) NOT NULL,                     -- 錯題標題（1-100 字元）
  question_text TEXT,                              -- 題目文字（選填）
  question_image_url TEXT,                         -- 題目照片 URL（選填）
  
  -- 步驟 2：答案與詳解
  my_answer TEXT NOT NULL,                         -- 我的答案（必填）
  correct_answer TEXT NOT NULL,                    -- 正確答案（必填）
  explanation TEXT,                                -- 詳解（選填）
  difficulty TEXT NOT NULL DEFAULT 'medium'        -- 難度（easy, medium, hard）
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- 學習數據
  wrong_count INTEGER NOT NULL DEFAULT 1,          -- 錯誤次數
  last_reviewed_at TIMESTAMP WITH TIME ZONE,       -- 最後複習時間
  
  -- 時間戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 約束：照片或題目文字至少一個必填
  CONSTRAINT question_content_check 
    CHECK (question_text IS NOT NULL OR question_image_url IS NOT NULL)
);

-- ============================================
-- 2. 建立 question_folders 中介表（多對多）
-- ============================================
CREATE TABLE IF NOT EXISTS question_folders (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 複合主鍵：確保同一題目不會重複關聯到同一資料夾
  PRIMARY KEY (question_id, folder_id)
);

-- ============================================
-- 3. 建立索引（優化查詢效能）
-- ============================================

-- questions 表索引
CREATE INDEX IF NOT EXISTS idx_questions_user_id 
  ON questions(user_id);

CREATE INDEX IF NOT EXISTS idx_questions_title 
  ON questions(title);

CREATE INDEX IF NOT EXISTS idx_questions_difficulty 
  ON questions(difficulty);

CREATE INDEX IF NOT EXISTS idx_questions_created_at 
  ON questions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_last_reviewed 
  ON questions(last_reviewed_at DESC NULLS LAST);

-- question_folders 表索引
CREATE INDEX IF NOT EXISTS idx_question_folders_question 
  ON question_folders(question_id);

CREATE INDEX IF NOT EXISTS idx_question_folders_folder 
  ON question_folders(folder_id);

-- ============================================
-- 4. 建立 updated_at 自動更新觸發器
-- ============================================
CREATE OR REPLACE FUNCTION update_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_updated_at_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_questions_updated_at();

-- ============================================
-- 5. 建立 RLS 政策（Row Level Security）
-- ============================================

-- 啟用 RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_folders ENABLE ROW LEVEL SECURITY;

-- questions 表政策：使用者只能操作自己的錯題
CREATE POLICY "Users can view own questions"
  ON questions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own questions"
  ON questions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions"
  ON questions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions"
  ON questions
  FOR DELETE
  USING (auth.uid() = user_id);

-- question_folders 表政策：只能操作自己錯題的關聯
CREATE POLICY "Users can view own question_folders"
  ON question_folders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions 
      WHERE questions.id = question_folders.question_id 
      AND questions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own question_folders"
  ON question_folders
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM questions 
      WHERE questions.id = question_folders.question_id 
      AND questions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own question_folders"
  ON question_folders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM questions 
      WHERE questions.id = question_folders.question_id 
      AND questions.user_id = auth.uid()
    )
  );

-- ============================================
-- 6. 建立輔助函數：取得錯題的所有資料夾
-- ============================================
CREATE OR REPLACE FUNCTION get_question_folders(p_question_id UUID)
RETURNS TABLE (
  folder_id UUID,
  folder_name VARCHAR(50),
  folder_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id AS folder_id,
    f.name AS folder_name,
    f.level AS folder_level
  FROM folders f
  INNER JOIN question_folders qf ON f.id = qf.folder_id
  WHERE qf.question_id = p_question_id
  ORDER BY f.level, f.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. 建立輔助函數：取得資料夾的所有錯題（含子資料夾）
-- ============================================
CREATE OR REPLACE FUNCTION get_folder_questions_recursive(
  p_folder_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  question_id UUID,
  title VARCHAR(100),
  difficulty TEXT,
  wrong_count INTEGER,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_tree AS (
    -- 起始：當前資料夾
    SELECT id FROM folders WHERE id = p_folder_id
    UNION
    -- 遞迴：所有子資料夾
    SELECT f.id 
    FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
  )
  SELECT DISTINCT
    q.id AS question_id,
    q.title,
    q.difficulty,
    q.wrong_count,
    q.last_reviewed_at,
    q.created_at
  FROM questions q
  INNER JOIN question_folders qf ON q.id = qf.question_id
  INNER JOIN folder_tree ft ON qf.folder_id = ft.id
  WHERE q.user_id = p_user_id
  ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. 建立輔助函數：更新錯誤次數
-- ============================================
CREATE OR REPLACE FUNCTION increment_wrong_count(p_question_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE questions
  SET wrong_count = wrong_count + 1,
      last_reviewed_at = NOW()
  WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. 建立輔助函數：標記已掌握（減少錯誤次數）
-- ============================================
CREATE OR REPLACE FUNCTION mark_as_mastered(p_question_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE questions
  SET wrong_count = GREATEST(wrong_count - 1, 0),
      last_reviewed_at = NOW()
  WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Migration 完成
-- ============================================
-- 說明：
--   執行此 SQL 後，請在 Supabase Dashboard 的 SQL Editor 中確認：
--   1. questions 表已建立
--   2. question_folders 表已建立
--   3. RLS 政策已啟用
--   4. 索引已建立
--   5. 輔助函數正常運作
-- ============================================
