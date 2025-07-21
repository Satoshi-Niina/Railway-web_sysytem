-- 機種マスタデータ
INSERT INTO vehicle_types (type_name, category) VALUES
('MC-100', 'モータカー'),
('MC-150', 'モータカー'),
('TT-200', '鉄トロ'),
('TT-250', '鉄トロ'),
('HP-300', 'ホッパー'),
('HP-350', 'ホッパー');

-- 基地マスタデータ
INSERT INTO bases (base_name, location) VALUES
('東京基地', '東京都品川区'),
('大阪基地', '大阪府大阪市'),
('名古屋基地', '愛知県名古屋市'),
('福岡基地', '福岡県福岡市'),
('仙台基地', '宮城県仙台市'),
('札幌基地', '北海道札幌市');

-- サンプル運用計画データ
INSERT INTO operation_plans (vehicle_id, plan_date, shift_type, start_time, end_time, planned_distance, departure_base_id, arrival_base_id, notes) VALUES
(1, '2024-01-15', 'day', '08:00', '17:00', 25.5, 1, 2, '定期点検作業'),
(1, '2024-01-16', 'night', '22:00', '06:00', 30.0, 2, 1, '夜間保守作業'),
(2, '2024-01-15', 'day', '09:00', '18:00', 18.2, 2, 3, '軌道点検'),
(3, '2024-01-15', 'day_night', '08:00', '02:00', 35.0, 3, 1, '大規模保守作業');

-- サンプル検査計画データ
INSERT INTO inspection_plans (vehicle_id, inspection_type, planned_start_date, planned_end_date, estimated_duration, priority, status) VALUES
(1, '年次検査', '2024-01-20', '2024-01-22', 3, 'high', 'planned'),
(2, '中間検査', '2024-01-18', '2024-01-18', 1, 'normal', 'planned'),
(3, '臨時検査', '2024-01-25', '2024-01-26', 2, 'urgent', 'planned');
