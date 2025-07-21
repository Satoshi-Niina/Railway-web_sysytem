-- travel_plans テーブルに出発基地と帰着基地のIDを追加
ALTER TABLE travel_plans
ADD COLUMN IF NOT EXISTS departure_base_id INTEGER REFERENCES bases(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS arrival_base_id INTEGER REFERENCES bases(id) ON DELETE SET NULL;

-- 既存の travel_plans データに基地IDをランダムに割り当てる（サンプル用）
-- 注意: 実際の運用では、既存データに合わせて適切な基地IDを設定してください
UPDATE travel_plans
SET
  departure_base_id = (SELECT id FROM bases ORDER BY RANDOM() LIMIT 1),
  arrival_base_id = (SELECT id FROM bases ORDER BY RANDOM() LIMIT 1)
WHERE departure_base_id IS NULL OR arrival_base_id IS NULL;
