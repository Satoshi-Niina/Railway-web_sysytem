-- 本番環境用データベースセットアップスクリプト（スキーマ別構造）
-- 機能別に4つのスキーマに分割: master_data, operations, inspections, maintenance
-- 
-- 実行方法:
-- psql -U postgres -d webappdb -f scripts/18-production-database-setup.sql
-- または: node scripts/setup-schema-structure.js

-- 既存のテーブルを削除（依存関係順）
DROP TABLE IF EXISTS public.operation_records CASCADE;
DROP TABLE IF EXISTS public.operation_plans CASCADE;
DROP TABLE IF EXISTS public.inspection_plans CASCADE;
DROP TABLE IF EXISTS public.maintenance_cycles CASCADE;
DROP TABLE IF EXISTS public.monthly_maintenance_plans CASCADE;
DROP TABLE IF EXISTS public.inspections CASCADE;
DROP TABLE IF EXISTS public.failures CASCADE;
DROP TABLE IF EXISTS public.repairs CASCADE;
DROP TABLE IF EXISTS public.travel_records CASCADE;
DROP TABLE IF EXISTS public.travel_plans CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.bases CASCADE;
DROP TABLE IF EXISTS public.management_offices CASCADE;
DROP TABLE IF EXISTS public.vehicle_types CASCADE;
DROP TABLE IF EXISTS public.inspection_types CASCADE;

-- スキーマ削除（存在する場合）
DROP SCHEMA IF EXISTS operations CASCADE;
DROP SCHEMA IF EXISTS inspections CASCADE;
DROP SCHEMA IF EXISTS maintenance CASCADE;
DROP SCHEMA IF EXISTS master_data CASCADE;

-- スキーマ作成
CREATE SCHEMA master_data;  -- マスターデータ（管理事業所、基地、車種、車両、検査種別）
CREATE SCHEMA operations;    -- 運用管理（運用計画、運用実績、走行計画、走行実績）
CREATE SCHEMA inspections;   -- 検査管理（検査計画、検査実績、保守サイクル）
CREATE SCHEMA maintenance;   -- 保守管理（故障記録、修理記録、月次保守計画）

-- =========================================
-- master_data スキーマ（マスターデータ）
-- =========================================

-- 管理事業所テーブル
CREATE TABLE master_data.management_offices (
    id SERIAL PRIMARY KEY,
    office_name VARCHAR(100) NOT NULL,
    office_code VARCHAR(20) UNIQUE NOT NULL,
    responsible_area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 基地テーブル
CREATE TABLE master_data.bases (
    id SERIAL PRIMARY KEY,
    base_name VARCHAR(100) NOT NULL,
    base_type VARCHAR(50) NOT NULL DEFAULT 'maintenance',
    location VARCHAR(200),
    management_office_id INTEGER REFERENCES master_data.management_offices(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 車種テーブル
CREATE TABLE master_data.vehicle_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 車両テーブル
CREATE TABLE master_data.vehicles (
    id SERIAL PRIMARY KEY,
    machine_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    model VARCHAR(50),
    manufacturer VARCHAR(100),
    acquisition_date DATE,
    management_office_id INTEGER REFERENCES master_data.management_offices(id),
    home_base_id INTEGER REFERENCES master_data.bases(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 検査種別テーブル
CREATE TABLE master_data.inspection_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    interval_days INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- operations スキーマ（運用管理）
-- =========================================

-- 運用計画テーブル
CREATE TABLE operations.operation_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES master_data.vehicles(id),
    plan_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'day',
    departure_base_id INTEGER REFERENCES master_data.bases(id),
    arrival_base_id INTEGER REFERENCES master_data.bases(id),
    planned_distance DECIMAL(8,2),
    start_time TIME,
    end_time TIME,
    status VARCHAR(20) DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 運用実績テーブル
CREATE TABLE operations.operation_records (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES master_data.vehicles(id),
    record_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'day',
    departure_base_id INTEGER REFERENCES master_data.bases(id),
    arrival_base_id INTEGER REFERENCES master_data.bases(id),
    actual_distance DECIMAL(8,2),
    actual_start_time TIME,
    actual_end_time TIME,
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    auto_imported BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 走行計画テーブル
CREATE TABLE operations.travel_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES master_data.vehicles(id),
    plan_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'day',
    departure_base_id INTEGER REFERENCES master_data.bases(id),
    arrival_base_id INTEGER REFERENCES master_data.bases(id),
    planned_distance DECIMAL(8,2),
    start_time TIME,
    end_time TIME,
    status VARCHAR(20) DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 走行実績テーブル
CREATE TABLE operations.travel_records (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES master_data.vehicles(id),
    record_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'day',
    departure_base_id INTEGER REFERENCES master_data.bases(id),
    arrival_base_id INTEGER REFERENCES master_data.bases(id),
    actual_distance DECIMAL(8,2),
    actual_start_time TIME,
    actual_end_time TIME,
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- inspections スキーマ（検査管理）
-- =========================================

-- 検査計画テーブル
CREATE TABLE inspections.inspection_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES master_data.vehicles(id),
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
CREATE TABLE inspections.inspections (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES master_data.vehicles(id),
    inspection_type VARCHAR(50) NOT NULL,
    inspection_category VARCHAR(50) NOT NULL,
    inspection_date DATE NOT NULL,
    inspector_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    findings TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 保守サイクルテーブル
CREATE TABLE inspections.maintenance_cycles (
    id SERIAL PRIMARY KEY,
    vehicle_type VARCHAR(50) NOT NULL,
    inspection_type VARCHAR(50) NOT NULL,
    cycle_days INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- maintenance スキーマ（保守管理）
-- =========================================

-- 故障記録テーブル
CREATE TABLE maintenance.failures (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES master_data.vehicles(id),
    failure_date DATE NOT NULL,
    failure_type VARCHAR(100),
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'reported',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 修理記録テーブル
CREATE TABLE maintenance.repairs (
    id SERIAL PRIMARY KEY,
    failure_id INTEGER REFERENCES maintenance.failures(id),
    vehicle_id INTEGER REFERENCES master_data.vehicles(id),
    repair_date DATE NOT NULL,
    repair_type VARCHAR(100),
    description TEXT,
    cost DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 月次保守計画テーブル
CREATE TABLE maintenance.monthly_maintenance_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES master_data.vehicles(id),
    plan_month DATE NOT NULL,
    inspection_type VARCHAR(50) NOT NULL,
    planned_date DATE,
    status VARCHAR(20) DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- インデックス作成（パフォーマンス向上）
-- =========================================

-- master_data スキーマ
CREATE INDEX idx_vehicles_type ON master_data.vehicles(vehicle_type);
CREATE INDEX idx_vehicles_office ON master_data.vehicles(management_office_id);
CREATE INDEX idx_vehicles_base ON master_data.vehicles(home_base_id);
CREATE INDEX idx_vehicles_status ON master_data.vehicles(status);

-- operations スキーマ
CREATE INDEX idx_operation_plans_date ON operations.operation_plans(plan_date);
CREATE INDEX idx_operation_plans_vehicle ON operations.operation_plans(vehicle_id);
CREATE INDEX idx_operation_plans_status ON operations.operation_plans(status);
CREATE INDEX idx_operation_records_date ON operations.operation_records(record_date);
CREATE INDEX idx_operation_records_vehicle ON operations.operation_records(vehicle_id);
CREATE INDEX idx_operation_records_status ON operations.operation_records(status);
CREATE INDEX idx_travel_plans_date ON operations.travel_plans(plan_date);
CREATE INDEX idx_travel_records_date ON operations.travel_records(record_date);

-- inspections スキーマ
CREATE INDEX idx_inspection_plans_date ON inspections.inspection_plans(planned_start_date);
CREATE INDEX idx_inspection_plans_vehicle ON inspections.inspection_plans(vehicle_id);
CREATE INDEX idx_inspection_plans_status ON inspections.inspection_plans(status);
CREATE INDEX idx_inspections_date ON inspections.inspections(inspection_date);
CREATE INDEX idx_inspections_vehicle ON inspections.inspections(vehicle_id);
CREATE INDEX idx_maintenance_cycles_type ON inspections.maintenance_cycles(vehicle_type);

-- maintenance スキーマ
CREATE INDEX idx_failures_date ON maintenance.failures(failure_date);
CREATE INDEX idx_failures_vehicle ON maintenance.failures(vehicle_id);
CREATE INDEX idx_failures_status ON maintenance.failures(status);
CREATE INDEX idx_repairs_date ON maintenance.repairs(repair_date);
CREATE INDEX idx_repairs_vehicle ON maintenance.repairs(vehicle_id);
CREATE INDEX idx_monthly_maintenance_plans_month ON maintenance.monthly_maintenance_plans(plan_month);

-- =========================================
-- 更新時刻自動更新のトリガー関数
-- =========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- master_data スキーマのトリガー
CREATE TRIGGER update_management_offices_updated_at BEFORE UPDATE ON master_data.management_offices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bases_updated_at BEFORE UPDATE ON master_data.bases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON master_data.vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- operations スキーマのトリガー
CREATE TRIGGER update_operation_plans_updated_at BEFORE UPDATE ON operations.operation_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operation_records_updated_at BEFORE UPDATE ON operations.operation_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travel_plans_updated_at BEFORE UPDATE ON operations.travel_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travel_records_updated_at BEFORE UPDATE ON operations.travel_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- inspections スキーマのトリガー
CREATE TRIGGER update_inspection_plans_updated_at BEFORE UPDATE ON inspections.inspection_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections.inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_cycles_updated_at BEFORE UPDATE ON inspections.maintenance_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- maintenance スキーマのトリガー
CREATE TRIGGER update_failures_updated_at BEFORE UPDATE ON maintenance.failures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repairs_updated_at BEFORE UPDATE ON maintenance.repairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_maintenance_plans_updated_at BEFORE UPDATE ON maintenance.monthly_maintenance_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 検索パスの設定（推奨）
-- =========================================
-- デフォルトの検索パスに全スキーマを追加
ALTER DATABASE webappdb SET search_path TO master_data, operations, inspections, maintenance, public;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'スキーマ構造の作成が完了しました';
    RAISE NOTICE 'master_data: 管理事業所、基地、車種、車両、検査種別';
    RAISE NOTICE 'operations: 運用計画、運用実績、走行計画、走行実績';
    RAISE NOTICE 'inspections: 検査計画、検査実績、保守サイクル';
    RAISE NOTICE 'maintenance: 故障記録、修理記録、月次保守計画';
END $$;
