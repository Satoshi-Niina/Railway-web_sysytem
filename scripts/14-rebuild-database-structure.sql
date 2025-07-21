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

-- 管理箇所テーブル
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
    start_time TIME,
    end_time TIME,
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
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

-- インデックス作成
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_office ON vehicles(management_office_id);
CREATE INDEX idx_vehicles_base ON vehicles(home_base_id);
CREATE INDEX idx_operation_plans_date ON operation_plans(plan_date);
CREATE INDEX idx_operation_plans_vehicle ON operation_plans(vehicle_id);
CREATE INDEX idx_operation_records_date ON operation_records(record_date);
CREATE INDEX idx_operation_records_vehicle ON operation_records(vehicle_id);
CREATE INDEX idx_inspection_plans_date ON inspection_plans(planned_start_date);
CREATE INDEX idx_inspection_plans_vehicle ON inspection_plans(vehicle_id);

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
