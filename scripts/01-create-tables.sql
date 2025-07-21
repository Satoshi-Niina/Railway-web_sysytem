-- 管理事業所テーブル
CREATE TABLE IF NOT EXISTS management_offices (
    id SERIAL PRIMARY KEY,
    office_name VARCHAR(100) NOT NULL,
    office_code VARCHAR(20) UNIQUE NOT NULL,
    responsible_area VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 基地テーブル
CREATE TABLE IF NOT EXISTS bases (
    id SERIAL PRIMARY KEY,
    base_name VARCHAR(100) NOT NULL,
    base_type VARCHAR(50) NOT NULL DEFAULT 'maintenance',
    location VARCHAR(100),
    management_office_id INTEGER REFERENCES management_offices(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 車両テーブル
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    machine_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    acquisition_date DATE,
    management_office_id INTEGER REFERENCES management_offices(id),
    home_base_id INTEGER REFERENCES bases(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 運用計画テーブル
CREATE TABLE IF NOT EXISTS operation_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    plan_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL,
    departure_base_id INTEGER REFERENCES bases(id),
    arrival_base_id INTEGER REFERENCES bases(id),
    planned_distance INTEGER,
    start_time TIME,
    end_time TIME,
    status VARCHAR(20) DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 運用実績テーブル
CREATE TABLE IF NOT EXISTS operation_records (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    record_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL,
    departure_base_id INTEGER REFERENCES bases(id),
    arrival_base_id INTEGER REFERENCES bases(id),
    actual_distance INTEGER,
    actual_start_time TIME,
    actual_end_time TIME,
    status VARCHAR(20) DEFAULT 'completed',
    auto_imported BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 検修計画テーブル
CREATE TABLE IF NOT EXISTS inspection_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    inspection_type VARCHAR(50) NOT NULL,
    inspection_category VARCHAR(50) NOT NULL,
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_vehicles_machine_number ON vehicles(machine_number);
CREATE INDEX IF NOT EXISTS idx_operation_plans_date ON operation_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_operation_records_date ON operation_records(record_date);
CREATE INDEX IF NOT EXISTS idx_inspection_plans_dates ON inspection_plans(planned_start_date, planned_end_date);

-- 更新時刻の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_management_offices_updated_at BEFORE UPDATE ON management_offices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bases_updated_at BEFORE UPDATE ON bases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operation_plans_updated_at BEFORE UPDATE ON operation_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operation_records_updated_at BEFORE UPDATE ON operation_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspection_plans_updated_at BEFORE UPDATE ON inspection_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
