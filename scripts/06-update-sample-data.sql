-- サンプル検査計画データを新しい検査種別で更新
UPDATE inspection_plans SET inspection_category = '甲検' WHERE inspection_type LIKE '%年次%';
UPDATE inspection_plans SET inspection_category = '定検' WHERE inspection_type LIKE '%中間%';
UPDATE inspection_plans SET inspection_category = '臨修' WHERE inspection_type LIKE '%臨時%';

-- 追加のサンプルデータ
INSERT INTO inspection_plans (vehicle_id, inspection_type, planned_start_date, planned_end_date, estimated_duration, inspection_category, status) VALUES
(1, '乙種検査', '2024-02-10', '2024-02-11', 2, '乙検', 'planned'),
(2, '甲種検査', '2024-02-15', '2024-02-18', 4, '甲検', 'planned'),
(3, '臨時修繕', '2024-01-28', '2024-01-28', 1, '臨修', 'planned');
