-- scripts/01-create-tables.sql
-- 車両マスタテーブル
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  base_location VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 走行計画テーブル
CREATE TABLE IF NOT EXISTS travel_plans (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  planned_distance DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 走行実績テーブル
CREATE TABLE IF NOT EXISTS travel_records (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  actual_distance DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 検査履歴テーブル
CREATE TABLE IF NOT EXISTS inspections (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  inspection_type VARCHAR(100) NOT NULL,
  inspection_date DATE NOT NULL,
  pdf_file_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 故障記録テーブル
CREATE TABLE IF NOT EXISTS failures (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  failure_date DATE NOT NULL,
  failure_content TEXT NOT NULL,
  image_urls TEXT[], -- 画像URLの配列
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 修繕記録テーブル
CREATE TABLE IF NOT EXISTS repairs (
  id SERIAL PRIMARY KEY,
  failure_id INTEGER REFERENCES failures(id) ON DELETE CASCADE,
  repair_date DATE NOT NULL,
  repair_content TEXT NOT NULL,
  repair_cost DECIMAL(10,2),
  image_urls TEXT[], -- 修繕後の画像URLの配列
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_travel_plans_date ON travel_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_travel_records_date ON travel_records(record_date);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_failures_date ON failures(failure_date);

-- scripts/02-seed-data.sql
-- サンプルデータの投入
INSERT INTO vehicles (name, model, category, base_location) VALUES
('モータカー001', 'MC-100', 'モータカー', '東京基地'),
('鉄トロ001', 'TT-200', '鉄トロ', '大阪基地'),
('ホッパー001', 'HP-300', 'ホッパー', '名古屋基地'),
('モータカー002', 'MC-150', 'モータカー', '東京基地'),
('鉄トロ002', 'TT-250', '鉄トロ', '福岡基地');

-- 走行計画サンプルデータ
INSERT INTO travel_plans (vehicle_id, plan_date, planned_distance) VALUES
(1, '2024-01-15', 25.5),
(1, '2024-01-16', 30.0),
(1, '2024-01-17', 22.8),
(2, '2024-01-15', 18.2),
(2, '2024-01-16', 20.5),
(3, '2024-01-15', 35.0);

-- 走行実績サンプルデータ
INSERT INTO travel_records (vehicle_id, record_date, actual_distance) VALUES
(1, '2024-01-15', 24.8),
(1, '2024-01-16', 28.5),
(2, '2024-01-15', 19.1),
(2, '2024-01-16', 21.2);

-- 検査履歴サンプルデータ
INSERT INTO inspections (vehicle_id, inspection_type, inspection_date, notes) VALUES
(1, '中間検査', '2024-01-10', '異常なし'),
(1, '年次検査', '2023-12-15', 'ブレーキパッド交換'),
(2, '中間検査', '2024-01-08', '軽微な調整実施'),
(3, '年次検査', '2023-11-20', '全体的に良好');

-- 故障記録サンプルデータ
INSERT INTO failures (vehicle_id, failure_date, failure_content) VALUES
(1, '2024-01-12', 'エンジンオイル漏れ'),
(2, '2024-01-05', 'ブレーキ異音'),
(3, '2023-12-28', '電気系統トラブル');

-- 修繕記録サンプルデータ
INSERT INTO repairs (failure_id, repair_date, repair_content, repair_cost) VALUES
(1, '2024-01-13', 'オイルシール交換', 15000),
(2, '2024-01-06', 'ブレーキパッド交換', 25000),
(3, '2023-12-29', '配線修理', 8000);

-- scripts/03-enhanced-schema.sql
-- 機種マスタテーブル
CREATE TABLE IF NOT EXISTS vehicle_types (
  id SERIAL PRIMARY KEY,
  type_name VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 基地マスタテーブル
CREATE TABLE IF NOT EXISTS bases (
  id SERIAL PRIMARY KEY,
  base_name VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 運用計画テーブル（拡張版）
CREATE TABLE IF NOT EXISTS operation_plans (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  shift_type VARCHAR(20) NOT NULL CHECK (shift_type IN ('day', 'night', 'day_night')),
  start_time TIME,
  end_time TIME,
  planned_distance DECIMAL(10,2) NOT NULL,
  departure_base_id INTEGER REFERENCES bases(id),
  arrival_base_id INTEGER REFERENCES bases(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 運用実績テーブル（拡張版）
CREATE TABLE IF NOT EXISTS operation_records (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER REFERENCES operation_plans(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  shift_type VARCHAR(20) NOT NULL,
  actual_start_time TIME,
  actual_end_time TIME,
  actual_distance DECIMAL(10,2) NOT NULL,
  departure_base_id INTEGER REFERENCES bases(id),
  arrival_base_id INTEGER REFERENCES bases(id),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'cancelled')),
  notes TEXT,
  auto_imported BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 検査計画テーブル
CREATE TABLE IF NOT EXISTS inspection_plans (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  inspection_type VARCHAR(100) NOT NULL,
  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  estimated_duration INTEGER, -- 日数
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'postponed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_operation_plans_date ON operation_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_operation_records_date ON operation_records(record_date);
CREATE INDEX IF NOT EXISTS idx_inspection_plans_date ON inspection_plans(planned_start_date, planned_end_date);

-- scripts/04-master-data.sql
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

-- scripts/05-update-inspection-types.sql
-- 検査計画テーブルの優先度を検査種別に変更
ALTER TABLE inspection_plans DROP COLUMN IF EXISTS priority;
ALTER TABLE inspection_plans ADD COLUMN inspection_category VARCHAR(20) DEFAULT '定検' CHECK (inspection_category IN ('臨修', '定検', '乙検', '甲検', 'その他')); -- 'その他'を追加

-- scripts/06-update-sample-data.sql
-- サンプル検査計画データを新しい検査種別で更新
UPDATE inspection_plans SET inspection_category = '甲検' WHERE inspection_type LIKE '%年次%';
UPDATE inspection_plans SET inspection_category = '定検' WHERE inspection_type LIKE '%中間%';
UPDATE inspection_plans SET inspection_category = '臨修' WHERE inspection_type LIKE '%臨時%';

-- 追加のサンプルデータ
INSERT INTO inspection_plans (vehicle_id, inspection_type, planned_start_date, planned_end_date, estimated_duration, inspection_category, status) VALUES
(1, '乙種検査', '2024-02-10', '2024-02-11', 2, '乙検', 'planned'),
(2, '甲種検査', '2024-02-15', '2024-02-18', 4, '甲検', 'planned'),
(3, '臨時修繕', '2024-01-28', '2024-01-28', 1, '臨修', 'planned');

-- scripts/07-update-travel-plans-schema.sql
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

-- scripts/08-update-vehicles-schema.sql
-- vehicles テーブルに新しいカラムを追加
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS machine_number VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100),
ADD COLUMN IF NOT EXISTS acquisition_date DATE,
ADD COLUMN IF NOT EXISTS management_office VARCHAR(100),
ADD COLUMN IF NOT EXISTS type_approval_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS type_approval_expiration_date DATE,
ADD COLUMN IF NOT EXISTS type_approval_conditions TEXT;

-- machine_number に NOT NULL 制約を追加する場合 (既存データがある場合は注意)
-- ALTER TABLE vehicles ALTER COLUMN machine_number SET NOT NULL;

-- scripts/09-seed-updated-vehicles.sql
-- 既存の車両データに新しいカラムのサンプルデータを追加
UPDATE vehicles
SET
  machine_number = 'M001' || id,
  manufacturer = CASE id
    WHEN 1 THEN 'A社'
    WHEN 2 THEN 'B社'
    WHEN 3 THEN 'C社'
    WHEN 4 THEN 'A社'
    WHEN 5 THEN 'B社'
    ELSE '不明'
  END,
  acquisition_date = CASE id
    WHEN 1 THEN '2020-04-01'
    WHEN 2 THEN '2021-07-10'
    WHEN 3 THEN '2019-11-20'
    WHEN 4 THEN '2022-01-15'
    WHEN 5 THEN '2023-03-01'
    ELSE '2020-01-01'
  END,
  management_office = CASE id
    WHEN 1 THEN '東京事業所'
    WHEN 2 THEN '大阪事業所'
    WHEN 3 THEN '名古屋事業所'
    WHEN 4 THEN '東京事業所'
    WHEN 5 THEN '福岡事業所'
    ELSE '不明'
  END,
  type_approval_number = 'TA' || LPAD(id::text, 3, '0'),
  type_approval_expiration_date = CASE id
    WHEN 1 THEN '2025-03-31'
    WHEN 2 THEN '2026-06-30'
    WHEN 3 THEN '2024-10-31'
    WHEN 4 THEN '2027-12-31'
    WHEN 5 THEN '2028-02-28'
    ELSE '2025-01-01'
  END,
  type_approval_conditions = CASE id
    WHEN 1 THEN '高速走行時要点検'
    WHEN 2 THEN '積載量制限あり'
    WHEN 3 THEN '特定区間のみ走行可'
    WHEN 4 THEN '冬季運用制限あり'
    WHEN 5 THEN '定期的なソフトウェア更新必須'
    ELSE '特になし'
  END
WHERE machine_number IS NULL;

-- 新しいフィールドを含む追加のサンプル車両データ
INSERT INTO vehicles (name, model, category, base_location, machine_number, manufacturer, acquisition_date, management_office, type_approval_number, type_approval_expiration_date, type_approval_conditions) VALUES
('モータカー003', 'MC-200', 'モータカー', '仙台基地', 'M006', 'D社', '2023-05-20', '仙台事業所', 'TA006', '2028-04-30', '寒冷地仕様'),
('鉄トロ003', 'TT-300', '鉄トロ', '札幌基地', 'M007', 'E社', '2022-08-10', '札幌事業所', 'TA007', '2027-07-31', '積雪時運用可');

-- scripts/10-refactor-vehicle-fields.sql
-- Step 1: Copy current 'name' (例: 'モータカー001') to 'machine_number'
-- これにより、既存の machine_number の値（例: 'M001'）は上書きされます。
-- machine_number は既に UNIQUE 制約が設定されています。
UPDATE vehicles SET machine_number = name;

-- Step 2: Copy current 'category' (例: 'モータカー') to 'name'
UPDATE vehicles SET name = category;

-- Step 3: Drop the 'category' column
ALTER TABLE vehicles DROP COLUMN category;

-- scripts/11-update-inspection-plan-schema.sql
-- inspection_plans テーブルの inspection_category CHECK 制約に 'その他' を追加
ALTER TABLE inspection_plans DROP CONSTRAINT IF EXISTS inspection_plans_inspection_category_check;
ALTER TABLE inspection_plans ADD CONSTRAINT inspection_plans_inspection_category_check CHECK (inspection_category IN ('臨修', '定検', '乙検', '甲検', 'その他'));

-- 既存の inspection_plans データに新しい検査種別を割り当てる（サンプル用）
-- 注意: 実際の運用では、既存データに合わせて適切な検査種別を設定してください
UPDATE inspection_plans
SET
  inspection_type = CASE inspection_category
    WHEN '臨修' THEN '臨時修繕'
    WHEN '定検' THEN '定期点検'
    WHEN '乙検' THEN '乙A検査' -- または乙B検査
    WHEN '甲検' THEN '甲A検査' -- または甲B検査
    ELSE 'その他'
  END;
