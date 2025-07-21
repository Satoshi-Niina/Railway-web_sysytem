-- 検査計画テーブルの優先度を検査種別に変更
ALTER TABLE inspection_plans DROP COLUMN IF EXISTS priority;
ALTER TABLE inspection_plans ADD COLUMN inspection_category VARCHAR(20) DEFAULT '定検' CHECK (inspection_category IN ('臨修', '定検', '乙検', '甲検'));

-- 既存データの更新（サンプル）
UPDATE inspection_plans SET inspection_category = '甲検' WHERE inspection_type LIKE '%年次%';
UPDATE inspection_plans SET inspection_category = '定検' WHERE inspection_type LIKE '%中間%';
UPDATE inspection_plans SET inspection_category = '臨修' WHERE inspection_type LIKE '%臨時%';
