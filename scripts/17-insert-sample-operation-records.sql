-- サンプル運用実績データ（過去1週間分）
INSERT INTO operation_records (vehicle_id, record_date, shift_type, departure_base_id, arrival_base_id, actual_distance, start_time, end_time, status) VALUES
-- 昨日の実績
(1, CURRENT_DATE - INTERVAL '1 day', 'day', 1, 1, 48.5, '08:05', '17:10', 'completed'),
(2, CURRENT_DATE - INTERVAL '1 day', 'day', 1, 1, 43.2, '08:35', '17:25', 'completed'),
(3, CURRENT_DATE - INTERVAL '1 day', 'night', 2, 2, 58.7, '20:10', '04:50', 'completed'),
(4, CURRENT_DATE - INTERVAL '1 day', 'day', 2, 2, 75.3, '07:15', '18:20', 'completed'),

-- 2日前の実績
(1, CURRENT_DATE - INTERVAL '2 days', 'day', 1, 1, 52.1, '08:00', '17:05', 'completed'),
(2, CURRENT_DATE - INTERVAL '2 days', 'night', 1, 1, 38.9, '20:05', '04:55', 'completed'),
(3, CURRENT_DATE - INTERVAL '2 days', 'day', 2, 2, 61.4, '08:10', '17:15', 'completed'),
(5, CURRENT_DATE - INTERVAL '2 days', 'day', 1, 1, 28.7, '09:05', '15:50', 'completed'),

-- 3日前の実績
(1, CURRENT_DATE - INTERVAL '3 days', 'day', 1, 1, 49.8, '08:00', '17:00', 'completed'),
(2, CURRENT_DATE - INTERVAL '3 days', 'day', 1, 1, 44.5, '08:30', '17:30', 'completed'),
(4, CURRENT_DATE - INTERVAL '3 days', 'day_night', 2, 2, 88.2, '08:00', '19:45', 'completed'),
(6, CURRENT_DATE - INTERVAL '3 days', 'day', 1, 1, 24.1, '09:30', '16:20', 'completed'),

-- 関西支社の実績
(10, CURRENT_DATE - INTERVAL '1 day', 'day', 3, 3, 43.8, '08:05', '17:05', 'completed'),
(11, CURRENT_DATE - INTERVAL '1 day', 'day', 3, 3, 48.9, '08:35', '17:35', 'completed'),
(12, CURRENT_DATE - INTERVAL '1 day', 'night', 4, 4, 68.5, '20:15', '04:45', 'completed'),

(10, CURRENT_DATE - INTERVAL '2 days', 'day', 3, 3, 41.2, '08:00', '17:00', 'completed'),
(11, CURRENT_DATE - INTERVAL '2 days', 'night', 3, 3, 46.7, '20:00', '05:00', 'completed'),

-- 九州支社の実績
(17, CURRENT_DATE - INTERVAL '1 day', 'day', 5, 5, 38.9, '08:05', '16:55', 'completed'),
(18, CURRENT_DATE - INTERVAL '1 day', 'day', 6, 6, 72.3, '07:35', '18:25', 'completed'),

(17, CURRENT_DATE - INTERVAL '2 days', 'day', 5, 5, 42.1, '08:00', '17:00', 'completed'),
(18, CURRENT_DATE - INTERVAL '2 days', 'night', 6, 6, 78.9, '19:30', '05:30', 'completed'),

-- 東北支社の実績
(21, CURRENT_DATE - INTERVAL '1 day', 'day', 7, 7, 33.7, '08:10', '16:50', 'completed'),
(22, CURRENT_DATE - INTERVAL '1 day', 'night', 8, 8, 82.4, '19:05', '05:55', 'completed'),

(21, CURRENT_DATE - INTERVAL '2 days', 'day', 7, 7, 36.8, '08:00', '17:00', 'completed'),
(22, CURRENT_DATE - INTERVAL '2 days', 'day', 8, 8, 79.6, '08:00', '18:00', 'completed'),

-- 一部中止された実績
(5, CURRENT_DATE - INTERVAL '1 day', 'day', 1, 1, 15.2, '09:00', '12:30', 'cancelled'),
(13, CURRENT_DATE - INTERVAL '2 days', 'night', 3, 3, 22.8, '20:00', '23:45', 'cancelled');

-- サンプル検査実績データ
INSERT INTO inspections (vehicle_id, inspection_type, inspection_category, inspection_date, inspector_name, status, findings) VALUES
-- 過去の検査実績
(2, '月次点検', '定期点検', CURRENT_DATE - INTERVAL '5 days', '田中太郎', 'completed', '異常なし'),
(4, '週間点検', '定期点検', CURRENT_DATE - INTERVAL '3 days', '佐藤花子', 'completed', 'ブレーキパッド摩耗確認'),
(6, '乙A検査', '法定検査', CURRENT_DATE - INTERVAL '7 days', '山田次郎', 'completed', '軽微な調整実施'),
(11, '月次点検', '定期点検', CURRENT_DATE - INTERVAL '4 days', '鈴木一郎', 'completed', '異常なし'),
(18, '週間点検', '定期点検', CURRENT_DATE - INTERVAL '2 days', '高橋美咲', 'completed', 'エンジンオイル交換'),
(21, '乙A検査', '法定検査', CURRENT_DATE - INTERVAL '6 days', '伊藤健太', 'completed', '電気系統点検完了');

-- サンプル故障記録データ
INSERT INTO failures (vehicle_id, failure_date, failure_type, description, severity, status) VALUES
(3, CURRENT_DATE - INTERVAL '10 days', 'エンジン不調', 'エンジンの回転が不安定', 'high', 'repaired'),
(7, CURRENT_DATE - INTERVAL '8 days', 'ブレーキ異常', 'ブレーキの効きが悪い', 'high', 'repaired'),
(12, CURRENT_DATE - INTERVAL '5 days', '電気系統', 'ライトが点灯しない', 'medium', 'repaired'),
(19, CURRENT_DATE - INTERVAL '3 days', '油圧系統', '油圧が上がらない', 'medium', 'under_repair'),
(22, CURRENT_DATE - INTERVAL '1 day', '冷却系統', '冷却水温度上昇', 'low', 'reported');

-- サンプル修理記録データ
INSERT INTO repairs (failure_id, vehicle_id, repair_date, repair_type, description, cost, status) VALUES
(1, 3, CURRENT_DATE - INTERVAL '8 days', 'エンジン修理', 'キャブレター清掃・調整', 25000.00, 'completed'),
(2, 7, CURRENT_DATE - INTERVAL '6 days', 'ブレーキ修理', 'ブレーキパッド交換', 15000.00, 'completed'),
(3, 12, CURRENT_DATE - INTERVAL '3 days', '電気修理', 'ヘッドライト交換', 8000.00, 'completed'),
(4, 19, CURRENT_DATE - INTERVAL '1 day', '油圧修理', '油圧ポンプ点検中', 0.00, 'in_progress');
