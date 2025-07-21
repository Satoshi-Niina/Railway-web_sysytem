-- サンプル車両データ
INSERT INTO vehicles (machine_number, vehicle_type, model, manufacturer, acquisition_date, management_office_id, home_base_id, status) VALUES
-- 本社保守事業所の車両
('M001', 'モータカー', 'MC-100', 'メーカーA', '2020-04-01', 1, 1, 'active'),
('M002', 'モータカー', 'MC-100', 'メーカーA', '2020-05-01', 1, 1, 'active'),
('M003', 'モータカー', 'MC-200', 'メーカーB', '2021-03-01', 1, 2, 'active'),
('MCR001', 'MCR', 'MCR-200', 'メーカーB', '2019-06-01', 1, 2, 'active'),
('T101', '鉄トロ（10t）', 'TT-10', 'メーカーC', '2018-04-01', 1, 1, 'active'),
('T102', '鉄トロ（10t）', 'TT-10', 'メーカーC', '2018-05-01', 1, 1, 'active'),
('T151', '鉄トロ（15t）', 'TT-15', 'メーカーC', '2019-04-01', 1, 2, 'active'),
('B001', '箱トロ', 'BT-01', 'メーカーD', '2017-04-01', 1, 1, 'active'),
('H001', 'ホッパー車', 'HP-01', 'メーカーE', '2020-04-01', 1, 2, 'active'),

-- 関西支社保守事業所の車両
('M011', 'モータカー', 'MC-100', 'メーカーA', '2020-06-01', 2, 3, 'active'),
('M012', 'モータカー', 'MC-200', 'メーカーB', '2021-04-01', 2, 3, 'active'),
('MCR011', 'MCR', 'MCR-200', 'メーカーB', '2019-07-01', 2, 4, 'active'),
('T111', '鉄トロ（10t）', 'TT-10', 'メーカーC', '2018-06-01', 2, 3, 'active'),
('T161', '鉄トロ（15t）', 'TT-15', 'メーカーC', '2019-05-01', 2, 4, 'active'),
('B011', '箱トロ', 'BT-01', 'メーカーD', '2017-05-01', 2, 3, 'active'),

-- 九州支社保守事業所の車両
('M021', 'モータカー', 'MC-100', 'メーカーA', '2020-07-01', 3, 5, 'active'),
('MCR021', 'MCR', 'MCR-200', 'メーカーB', '2019-08-01', 3, 6, 'active'),
('T121', '鉄トロ（10t）', 'TT-10', 'メーカーC', '2018-07-01', 3, 5, 'active'),
('T171', '鉄トロ（15t）', 'TT-15', 'メーカーC', '2019-06-01', 3, 6, 'active'),

-- 東北支社保守事業所の車両
('M031', 'モータカー', 'MC-200', 'メーカーB', '2021-05-01', 4, 7, 'active'),
('MCR031', 'MCR', 'MCR-200', 'メーカーB', '2019-09-01', 4, 8, 'active'),
('T131', '鉄トロ（10t）', 'TT-10', 'メーカーC', '2018-08-01', 4, 7, 'active'),
('T181', '鉄トロ（15t）', 'TT-15', 'メーカーC', '2019-07-01', 4, 8, 'active');

-- サンプル運用計画データ（今月分）
INSERT INTO operation_plans (vehicle_id, plan_date, shift_type, departure_base_id, arrival_base_id, planned_distance, start_time, end_time, status) VALUES
-- 今月の運用計画
(1, CURRENT_DATE, 'day', 1, 1, 50.0, '08:00', '17:00', 'confirmed'),
(2, CURRENT_DATE, 'day', 1, 1, 45.0, '08:30', '17:30', 'confirmed'),
(3, CURRENT_DATE, 'night', 2, 2, 60.0, '20:00', '05:00', 'confirmed'),
(4, CURRENT_DATE, 'day', 2, 2, 80.0, '07:00', '18:00', 'confirmed'),
(5, CURRENT_DATE, 'day', 1, 1, 30.0, '09:00', '16:00', 'planned'),
(6, CURRENT_DATE, 'day', 1, 1, 25.0, '09:30', '16:30', 'planned'),

-- 明日の運用計画
(1, CURRENT_DATE + INTERVAL '1 day', 'day', 1, 1, 55.0, '08:00', '17:00', 'planned'),
(2, CURRENT_DATE + INTERVAL '1 day', 'night', 1, 1, 40.0, '20:00', '05:00', 'planned'),
(3, CURRENT_DATE + INTERVAL '1 day', 'day', 2, 2, 65.0, '08:00', '17:00', 'planned'),
(4, CURRENT_DATE + INTERVAL '1 day', 'day_night', 2, 2, 90.0, '08:00', '20:00', 'planned'),

-- 関西支社の運用計画
(10, CURRENT_DATE, 'day', 3, 3, 45.0, '08:00', '17:00', 'confirmed'),
(11, CURRENT_DATE, 'day', 3, 3, 50.0, '08:30', '17:30', 'confirmed'),
(12, CURRENT_DATE, 'night', 4, 4, 70.0, '20:00', '05:00', 'confirmed'),

-- 九州支社の運用計画
(17, CURRENT_DATE, 'day', 5, 5, 40.0, '08:00', '17:00', 'confirmed'),
(18, CURRENT_DATE, 'day', 6, 6, 75.0, '07:30', '18:30', 'confirmed'),

-- 東北支社の運用計画
(21, CURRENT_DATE, 'day', 7, 7, 35.0, '08:00', '17:00', 'confirmed'),
(22, CURRENT_DATE, 'night', 8, 8, 85.0, '19:00', '06:00', 'confirmed');

-- サンプル検査計画データ
INSERT INTO inspection_plans (vehicle_id, inspection_type, inspection_category, planned_start_date, planned_end_date, status) VALUES
-- 今月の検査計画
(1, '乙A検査', '法定検査', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days', 'planned'),
(3, '甲A検査', '法定検査', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '10 days', 'planned'),
(5, '月次点検', '定期点検', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day', 'planned'),
(10, '乙B検査', '法定検査', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '8 days', 'planned'),
(17, '月次点検', '定期点検', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', 'planned');
