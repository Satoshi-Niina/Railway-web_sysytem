-- ステージング環境用データベースセットアップスクリプト
-- 本番環境と同じスキーマだが、テストデータを含む

-- 既存のテーブルを削除（依存関係順）
DROP TABLE IF EXISTS operation_records CASCADE;
DROP TABLE IF EXISTS operation_plans CASCADE;
DROP TABLE IF EXISTS inspection_plans CASCADE;
DROP TABLE IF EXISTS maintenance_cycles CASCADE;
DROP TABLE IF EXISTS monthly_maintenance_plans CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS failures CASCADE;
DROP TABLE IF EXISTS repairs CASCADE;
DROP TABLE IF EXISTS travel_records CASCADE;
DROP TABLE IF EXISTS travel_plans CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS bases CASCADE;
DROP TABLE IF EXISTS management_offices CASCADE;
DROP TABLE IF EXISTS vehicle_types CASCADE;
DROP TABLE IF EXISTS inspection_types CASCADE;

-- 管理事業所テーブル
CREATE TABLE management_offices (
    id SERIAL PRIMARY KEY,
    office_name VARCHAR(100) NOT NULL,
    office_code VARCHAR(20) UNIQUE NOT NULL,
    responsible_area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 基地テーブル
CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    base_name VARCHAR(100) NOT NULL,
    base_type VARCHAR(50) NOT NULL DEFAULT 'maintenance',
    location VARCHAR(200),
    management_office_id INTEGER REFERENCES management_offices(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 車種テーブル
CREATE TABLE vehicle_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 車両テーブル
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    machine_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    model VARCHAR(50),
    manufacturer VARCHAR(100),
    acquisition_date DATE,
    management_office_id INTEGER REFERENCES management_offices(id),
    home_base_id INTEGER REFERENCES bases(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 検査種別テーブル
CREATE TABLE inspection_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    interval_days INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 運用計画テーブル
CREATE TABLE operation_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    plan_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'day',
    departure_base_id INTEGER REFERENCES bases(id),
    arrival_base_id INTEGER REFERENCES bases(id),
    planned_distance DECIMAL(8,2),
    start_time TIME,
    end_time TIME,
    status VARCHAR(20) DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 運用実績テーブル
CREATE TABLE operation_records (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    record_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'day',
    departure_base_id INTEGER REFERENCES bases(id),
    arrival_base_id INTEGER REFERENCES bases(id),
    actual_distance DECIMAL(8,2),
    actual_start_time TIME,
    actual_end_time TIME,
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    auto_imported BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 検査計画テーブル
CREATE TABLE inspection_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    inspection_type VARCHAR(50) NOT NULL,
    inspection_category VARCHAR(50) NOT NULL,
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 検査実績テーブル
CREATE TABLE inspections (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    inspection_type VARCHAR(50) NOT NULL,
    inspection_category VARCHAR(50) NOT NULL,
    inspection_date DATE NOT NULL,
    inspector_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    findings TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 故障記録テーブル
CREATE TABLE failures (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    failure_date DATE NOT NULL,
    failure_type VARCHAR(100),
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'reported',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 修理記録テーブル
CREATE TABLE repairs (
    id SERIAL PRIMARY KEY,
    failure_id INTEGER REFERENCES failures(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    repair_date DATE NOT NULL,
    repair_type VARCHAR(100),
    description TEXT,
    cost DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 保守サイクルテーブル
CREATE TABLE maintenance_cycles (
    id SERIAL PRIMARY KEY,
    vehicle_type VARCHAR(50) NOT NULL,
    inspection_type VARCHAR(50) NOT NULL,
    cycle_days INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 月次保守計画テーブル
CREATE TABLE monthly_maintenance_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    plan_month DATE NOT NULL,
    inspection_type VARCHAR(50) NOT NULL,
    planned_date DATE,
    status VARCHAR(20) DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 走行計画テーブル
CREATE TABLE travel_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    plan_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'day',
    departure_base_id INTEGER REFERENCES bases(id),
    arrival_base_id INTEGER REFERENCES bases(id),
    planned_distance DECIMAL(8,2),
    start_time TIME,
    end_time TIME,
    status VARCHAR(20) DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 走行実績テーブル
CREATE TABLE travel_records (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    record_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'day',
    departure_base_id INTEGER REFERENCES bases(id),
    arrival_base_id INTEGER REFERENCES bases(id),
    actual_distance DECIMAL(8,2),
    actual_start_time TIME,
    actual_end_time TIME,
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_office ON vehicles(management_office_id);
CREATE INDEX idx_vehicles_base ON vehicles(home_base_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_operation_plans_date ON operation_plans(plan_date);
CREATE INDEX idx_operation_plans_vehicle ON operation_plans(vehicle_id);
CREATE INDEX idx_operation_plans_status ON operation_plans(status);
CREATE INDEX idx_operation_records_date ON operation_records(record_date);
CREATE INDEX idx_operation_records_vehicle ON operation_records(vehicle_id);
CREATE INDEX idx_operation_records_status ON operation_records(status);
CREATE INDEX idx_inspection_plans_date ON inspection_plans(planned_start_date);
CREATE INDEX idx_inspection_plans_vehicle ON inspection_plans(vehicle_id);
CREATE INDEX idx_inspection_plans_status ON inspection_plans(status);
CREATE INDEX idx_inspections_date ON inspections(inspection_date);
CREATE INDEX idx_inspections_vehicle ON inspections(vehicle_id);
CREATE INDEX idx_failures_date ON failures(failure_date);
CREATE INDEX idx_failures_vehicle ON failures(vehicle_id);
CREATE INDEX idx_failures_status ON failures(status);
CREATE INDEX idx_repairs_date ON repairs(repair_date);
CREATE INDEX idx_repairs_vehicle ON repairs(vehicle_id);
CREATE INDEX idx_maintenance_cycles_type ON maintenance_cycles(vehicle_type);
CREATE INDEX idx_monthly_maintenance_plans_month ON monthly_maintenance_plans(plan_month);
CREATE INDEX idx_travel_plans_date ON travel_plans(plan_date);
CREATE INDEX idx_travel_records_date ON travel_records(record_date);

-- 更新時刻自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_management_offices_updated_at BEFORE UPDATE ON management_offices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bases_updated_at BEFORE UPDATE ON bases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operation_plans_updated_at BEFORE UPDATE ON operation_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operation_records_updated_at BEFORE UPDATE ON operation_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspection_plans_updated_at BEFORE UPDATE ON inspection_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_failures_updated_at BEFORE UPDATE ON failures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repairs_updated_at BEFORE UPDATE ON repairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_cycles_updated_at BEFORE UPDATE ON maintenance_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_maintenance_plans_updated_at BEFORE UPDATE ON monthly_maintenance_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travel_plans_updated_at BEFORE UPDATE ON travel_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travel_records_updated_at BEFORE UPDATE ON travel_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ステージング環境用のテストデータ挿入
INSERT INTO management_offices (office_name, office_code, responsible_area) VALUES
('テスト保守事業所', 'TEST001', 'テストエリア'),
('ステージング保守事業所', 'STAGE001', 'ステージングエリア');

INSERT INTO bases (base_name, base_type, location, management_office_id) VALUES
('テスト基地', 'maintenance', 'テスト県テスト市', 1),
('ステージング基地', 'maintenance', 'ステージング県ステージング市', 2);

INSERT INTO vehicle_types (type_name, category, description) VALUES
('TEST-MC-100', 'テストモータカー', 'テスト用小型モータカー'),
('TEST-TT-200', 'テスト鉄トロ', 'テスト用10t鉄トロ');

INSERT INTO inspection_types (type_name, category, interval_days, description) VALUES
('テスト定期点検', 'テスト定検', 30, 'テスト用月次定期点検'),
('テスト乙A検査', 'テスト乙検', 90, 'テスト用3ヶ月乙A検査');

-- テスト用車両データ
INSERT INTO vehicles (machine_number, vehicle_type, model, manufacturer, acquisition_date, management_office_id, home_base_id, status) VALUES
('TEST001', 'TEST-MC-100', 'TEST-MC-100A', 'テスト車両製造', '2024-01-01', 1, 1, 'active'),
('TEST002', 'TEST-TT-200', 'TEST-TT-200A', 'テスト車両製造', '2024-01-02', 2, 2, 'active');

-- テスト用保守サイクル設定
INSERT INTO maintenance_cycles (vehicle_type, inspection_type, cycle_days, description, is_active) VALUES
('TEST-MC-100', 'テスト定期点検', 30, 'テスト用定期点検周期', true),
('TEST-MC-100', 'テスト乙A検査', 90, 'テスト用乙A検査周期', true),
('TEST-TT-200', 'テスト定期点検', 30, 'テスト用定期点検周期', true);

-- テスト用運用計画データ
INSERT INTO operation_plans (vehicle_id, plan_date, shift_type, departure_base_id, arrival_base_id, planned_distance, start_time, end_time, status, notes) VALUES
(1, CURRENT_DATE + INTERVAL '1 day', 'day', 1, 2, 25.5, '08:00', '17:00', 'planned', 'テスト運用計画'),
(2, CURRENT_DATE + INTERVAL '2 days', 'day', 2, 1, 30.0, '09:00', '18:00', 'planned', 'テスト運用計画2');

-- テスト用検査計画データ
INSERT INTO inspection_plans (vehicle_id, inspection_type, inspection_category, planned_start_date, planned_end_date, status, notes) VALUES
(1, 'テスト定期点検', 'テスト定検', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 'planned', 'テスト検査計画'),
(2, 'テスト乙A検査', 'テスト乙検', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '14 days', 'planned', 'テスト検査計画2');

-- パフォーマンス最適化のための統計情報更新
ANALYZE; 