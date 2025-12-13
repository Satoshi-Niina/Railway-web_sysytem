-- 運用計画テーブルに終了日カラムを追加
-- 翌日にまたがる運用を明示的に管理するため

-- operations.operation_plansテーブルに終了日カラムを追加
ALTER TABLE operations.operation_plans 
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 既存データの場合、end_dateをplan_dateと同じにする（当日終了）
UPDATE operations.operation_plans 
SET end_date = plan_date 
WHERE end_date IS NULL;

-- 終了日は計画日以降である必要がある
ALTER TABLE operations.operation_plans 
ADD CONSTRAINT check_end_date_after_plan_date 
CHECK (end_date >= plan_date);

-- コメント追加
COMMENT ON COLUMN operations.operation_plans.end_date IS '終了日（翌日にまたがる運用の場合はplan_dateより後の日付）';

-- インデックス追加（検索効率化）
CREATE INDEX IF NOT EXISTS idx_operation_plans_end_date 
ON operations.operation_plans(end_date);

-- 確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'operations' 
  AND table_name = 'operation_plans'
ORDER BY ordinal_position;
