-- 事業所・保守基地・車両マスタのテーブル作成とリレーション設定

-- 1. 事業所マスタテーブルの作成
CREATE TABLE IF NOT EXISTS management_offices (
    id SERIAL PRIMARY KEY,
    office_name VARCHAR(100) NOT NULL,
    office_code VARCHAR(20) UNIQUE NOT NULL,
    location VARCHAR(100),
    station_1 VARCHAR(50),
    station_2 VARCHAR(50),
    station_3 VARCHAR(50),
    station_4 VARCHAR(50),
    station_5 VARCHAR(50),
    station_6 VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 事業所マスタのコメント
COMMENT ON TABLE management_offices IS '事業所マスタ';
COMMENT ON COLUMN management_offices.id IS '事業所ID';
COMMENT ON COLUMN management_offices.office_name IS '事業所名';
COMMENT ON COLUMN management_offices.office_code IS '事業所コード';
COMMENT ON COLUMN management_offices.location IS '所在地';
COMMENT ON COLUMN management_offices.station_1 IS '担当駅1';
COMMENT ON COLUMN management_offices.station_2 IS '担当駅2';
COMMENT ON COLUMN management_offices.station_3 IS '担当駅3';
COMMENT ON COLUMN management_offices.station_4 IS '担当駅4';
COMMENT ON COLUMN management_offices.station_5 IS '担当駅5';
COMMENT ON COLUMN management_offices.station_6 IS '担当駅6';

-- 2. 保守基地マスタテーブルの作成（事業所とのリレーション）
CREATE TABLE IF NOT EXISTS maintenance_bases (
    id SERIAL PRIMARY KEY,
    base_name VARCHAR(100) NOT NULL,
    base_code VARCHAR(20) UNIQUE NOT NULL,
    location VARCHAR(100),
    address TEXT,
    management_office_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (management_office_id) REFERENCES management_offices(id) ON DELETE RESTRICT
);

-- 保守基地マスタのコメント
COMMENT ON TABLE maintenance_bases IS '保守基地マスタ';
COMMENT ON COLUMN maintenance_bases.id IS '保守基地ID';
COMMENT ON COLUMN maintenance_bases.base_name IS '保守基地名';
COMMENT ON COLUMN maintenance_bases.base_code IS '保守基地コード';
COMMENT ON COLUMN maintenance_bases.location IS '所在地';
COMMENT ON COLUMN maintenance_bases.address IS '住所';
COMMENT ON COLUMN maintenance_bases.management_office_id IS '管理事業所ID';

-- 3. 車両マスタテーブルの作成（事業所・保守基地とのリレーション）
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    machine_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    acquisition_date VARCHAR(7), -- YYYY-MM形式
    type_approval_start_date VARCHAR(7), -- YYYY-MM形式
    type_approval_duration INTEGER,
    special_notes TEXT,
    management_office_id INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (management_office_id) REFERENCES management_offices(id) ON DELETE SET NULL
);

-- 車両マスタのコメント
COMMENT ON TABLE vehicles IS '車両マスタ';
COMMENT ON COLUMN vehicles.id IS '車両ID';
COMMENT ON COLUMN vehicles.machine_number IS '機械番号';
COMMENT ON COLUMN vehicles.vehicle_type IS '機種';
COMMENT ON COLUMN vehicles.model IS '型式';
COMMENT ON COLUMN vehicles.manufacturer IS '製造メーカー';
COMMENT ON COLUMN vehicles.acquisition_date IS '取得年月（YYYY-MM形式）';
COMMENT ON COLUMN vehicles.type_approval_start_date IS '型式認定有効起算日（YYYY-MM形式）';
COMMENT ON COLUMN vehicles.type_approval_duration IS '型式認定有効期間（月数）';
COMMENT ON COLUMN vehicles.special_notes IS '特記事項';
COMMENT ON COLUMN vehicles.management_office_id IS '管理事業所ID';
COMMENT ON COLUMN vehicles.status IS 'ステータス';

-- 4. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_management_offices_office_code ON management_offices(office_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_bases_base_code ON maintenance_bases(base_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_bases_office_id ON maintenance_bases(management_office_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_machine_number ON vehicles(machine_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_office_id ON vehicles(management_office_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- 5. サンプルデータの挿入（事業所マスタ）
INSERT INTO management_offices (office_name, office_code, location, station_1, station_2) VALUES
('本社保守事業所', 'HO01', '東京', '東京駅', '品川駅'),
('関西支社保守事業所', 'KA01', '大阪', '大阪駅', '新大阪駅')
ON CONFLICT (office_code) DO NOTHING;

-- 6. サンプルデータの挿入（保守基地マスタ）
INSERT INTO maintenance_bases (base_name, base_code, location, address, management_office_id) VALUES
('本社保守基地', 'HO01', '東京', '東京都渋谷区○○1-1-1', (SELECT id FROM management_offices WHERE office_code = 'HO01')),
('関西保守基地', 'KA01', '大阪', '大阪府大阪市○○3-3-3', (SELECT id FROM management_offices WHERE office_code = 'KA01'))
ON CONFLICT (base_code) DO NOTHING;

-- 7. サンプルデータの挿入（車両マスタ）
INSERT INTO vehicles (machine_number, vehicle_type, model, manufacturer, acquisition_date, type_approval_start_date, type_approval_duration, special_notes, management_office_id) VALUES
('MC001', 'MC-100', 'MC-100A', '鉄道車両製造株式会社', '2020-01', '2020-01', 12, '特になし', (SELECT id FROM management_offices WHERE office_code = 'HO01')),
('MC002', 'MC-150', 'MC-150B', '鉄道車両製造株式会社', '2021-03', '2021-03', 12, '特になし', (SELECT id FROM management_offices WHERE office_code = 'KA01'))
ON CONFLICT (machine_number) DO NOTHING;

-- 8. テーブル作成確認
SELECT 
    'management_offices' as table_name,
    COUNT(*) as record_count
FROM management_offices
UNION ALL
SELECT 
    'maintenance_bases' as table_name,
    COUNT(*) as record_count
FROM maintenance_bases
UNION ALL
SELECT 
    'vehicles' as table_name,
    COUNT(*) as record_count
FROM vehicles; 