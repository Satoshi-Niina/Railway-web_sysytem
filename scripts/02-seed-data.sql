-- 管理事業所データ
INSERT INTO management_offices (office_name, office_code, responsible_area) VALUES
('本社保守事業所', 'HQ001', '関東エリア'),
('関西支社保守事業所', 'KS001', '関西エリア'),
('九州支社保守事業所', 'KY001', '九州エリア')
ON CONFLICT (office_code) DO NOTHING;

-- 基地データ
INSERT INTO bases (base_name, base_type, location, management_office_id) VALUES
('本社保守基地', 'maintenance', '東京', 1),
('品川保守基地', 'maintenance', '東京', 1),
('関西保守基地', 'maintenance', '大阪', 2),
('神戸保守基地', 'maintenance', '兵庫', 2),
('九州保守基地', 'maintenance', '福岡', 3);

-- 車両データ
INSERT INTO vehicles (machine_number, vehicle_type, model, manufacturer, acquisition_date, management_office_id, home_base_id) VALUES
('M001', 'モータカー', 'MC-100', 'メーカーA', '2020-04-01', 1, 1),
('M002', 'モータカー', 'MC-100', 'メーカーA', '2020-05-01', 1, 1),
('M003', 'モータカー', 'MC-200', 'メーカーB', '2021-03-01', 1, 2),
('MCR001', 'MCR', 'MCR-300', 'メーカーC', '2019-06-01', 2, 3),
('MCR002', 'MCR', 'MCR-300', 'メーカーC', '2019-07-01', 2, 3),
('T001', '鉄トロ（10t）', 'TT-10', 'メーカーD', '2018-08-01', 2, 4),
('T002', '鉄トロ（15t）', 'TT-15', 'メーカーD', '2018-09-01', 3, 5),
('H001', '箱トロ', 'HT-20', 'メーカーE', '2017-10-01', 3, 5);

-- 運用計画サンプルデータ（当月）
INSERT INTO operation_plans (vehicle_id, plan_date, shift_type, departure_base_id, arrival_base_id, planned_distance, start_time, end_time) VALUES
(1, CURRENT_DATE, 'day', 1, 1, 50, '08:00', '17:00'),
(2, CURRENT_DATE + INTERVAL '1 day', 'night', 1, 1, 30, '22:00', '06:00'),
(3, CURRENT_DATE + INTERVAL '2 days', 'day', 2, 2, 40, '09:00', '18:00'),
(4, CURRENT_DATE + INTERVAL '3 days', 'day_night', 3, 3, 80, '08:00', '20:00'),
(5, CURRENT_DATE + INTERVAL '4 days', 'day', 3, 3, 35, '08:30', '17:30');

-- 運用実績サンプルデータ
INSERT INTO operation_records (vehicle_id, record_date, shift_type, departure_base_id, arrival_base_id, actual_distance, actual_start_time, actual_end_time, status) VALUES
(1, CURRENT_DATE - INTERVAL '1 day', 'day', 1, 1, 48, '08:15', '16:45', 'completed'),
(2, CURRENT_DATE - INTERVAL '2 days', 'night', 1, 1, 28, '22:10', '05:50', 'completed'),
(3, CURRENT_DATE - INTERVAL '3 days', 'day', 2, 2, 42, '09:05', '17:55', 'completed');

-- 検修計画サンプルデータ
INSERT INTO inspection_plans (vehicle_id, inspection_type, inspection_category, planned_start_date, planned_end_date) VALUES
(6, '乙A検査', '法定検査', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '12 days'),
(7, '定期点検', '定期点検', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days'),
(8, '甲A検査', '法定検査', CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '25 days');
