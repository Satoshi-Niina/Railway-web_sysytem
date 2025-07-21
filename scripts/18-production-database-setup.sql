-- 本番環境用データベースセットアップスクリプト
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

-- インデックス作成（パフォーマンス向上）
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

-- 本番環境用のマスタデータ挿入
INSERT INTO management_offices (office_name, office_code, responsible_area) VALUES
('本社保守事業所', 'HQ001', '関東エリア'),
('関西支社保守事業所', 'KS001', '関西エリア'),
('中部支社保守事業所', 'CH001', '中部エリア'),
('九州支社保守事業所', 'KY001', '九州エリア');

INSERT INTO bases (base_name, base_type, location, management_office_id) VALUES
('東京基地', 'maintenance', '東京都品川区', 1),
('横浜基地', 'maintenance', '神奈川県横浜市', 1),
('大阪基地', 'maintenance', '大阪府大阪市', 2),
('京都基地', 'maintenance', '京都府京都市', 2),
('名古屋基地', 'maintenance', '愛知県名古屋市', 3),
('福岡基地', 'maintenance', '福岡県福岡市', 4);

INSERT INTO vehicle_types (type_name, category, description) VALUES
('MC-100', 'モータカー', '小型モータカー'),
('MC-150', 'モータカー', '中型モータカー'),
('TT-200', '鉄トロ', '10t鉄トロ'),
('TT-250', '鉄トロ', '15t鉄トロ'),
('HP-300', 'ホッパー', '小型ホッパー'),
('HP-350', 'ホッパー', '大型ホッパー');

INSERT INTO inspection_types (type_name, category, interval_days, description) VALUES
('定期点検', '定検', 30, '月次定期点検'),
('乙A検査', '乙検', 90, '3ヶ月乙A検査'),
('乙B検査', '乙検', 180, '6ヶ月乙B検査'),
('甲A検査', '甲検', 365, '年次甲A検査'),
('甲B検査', '甲検', 730, '2年次甲B検査'),
('臨時修繕', '臨修', NULL, '故障時の臨時修繕');

-- サンプル車両データ
INSERT INTO vehicles (machine_number, vehicle_type, model, manufacturer, acquisition_date, management_office_id, home_base_id, status) VALUES
('MC001', 'MC-100', 'MC-100A', '鉄道車両製造', '2020-01-15', 1, 1, 'active'),
('MC002', 'MC-100', 'MC-100A', '鉄道車両製造', '2020-02-20', 1, 1, 'active'),
('MC003', 'MC-150', 'MC-150B', '鉄道車両製造', '2021-03-10', 1, 2, 'active'),
('TT001', 'TT-200', 'TT-200A', '鉄道車両製造', '2019-06-15', 2, 3, 'active'),
('TT002', 'TT-250', 'TT-250B', '鉄道車両製造', '2021-08-22', 2, 3, 'active'),
('HP001', 'HP-300', 'HP-300A', '鉄道車両製造', '2020-11-05', 3, 5, 'active');

-- 保守サイクル設定
INSERT INTO maintenance_cycles (vehicle_type, inspection_type, cycle_days, description, is_active) VALUES
('MC-100', '定期点検', 30, 'MC-100定期点検周期', true),
('MC-100', '乙A検査', 90, 'MC-100乙A検査周期', true),
('MC-100', '乙B検査', 180, 'MC-100乙B検査周期', true),
('MC-100', '甲A検査', 365, 'MC-100甲A検査周期', true),
('MC-150', '定期点検', 30, 'MC-150定期点検周期', true),
('MC-150', '乙A検査', 90, 'MC-150乙A検査周期', true),
('TT-200', '定期点検', 30, 'TT-200定期点検周期', true),
('TT-200', '乙A検査', 90, 'TT-200乙A検査周期', true),
('TT-250', '定期点検', 30, 'TT-250定期点検周期', true),
('TT-250', '乙A検査', 90, 'TT-250乙A検査周期', true);

-- パフォーマンス最適化のための統計情報更新
ANALYZE; 