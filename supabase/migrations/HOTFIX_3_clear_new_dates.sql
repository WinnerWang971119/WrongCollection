-- ============================================
-- 修復 3: 清除錯誤的 next_review_date 初始化
-- 說明：新題目（review_state='new'）的 next_review_date 應該是 NULL
--      只有在第一次複習後才會設定 next_review_date
-- ============================================

-- ✅ 將所有新題目的 next_review_date 設為 NULL
UPDATE questions 
SET next_review_date = NULL
WHERE review_state = 'new' AND next_review_date IS NOT NULL;

-- ============================================
-- ✅ 修復完成！
-- 
-- 變更說明：
-- 1. 新題目（review_state='new'）的 next_review_date 設為 NULL
-- 2. 這樣新題目就不會被判定為逾期
-- 3. 第一次複習時，SM-2 演算法會計算並設定 next_review_date
-- ============================================
