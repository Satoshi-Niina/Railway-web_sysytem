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
