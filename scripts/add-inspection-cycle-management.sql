-- =========================================
-- 検修周期管理システム
-- =========================================

-- 1. 検査サイクル順序マスタ（検査種別の順序を管理）
CREATE TABLE IF NOT EXISTS inspections.inspection_cycle_order (
    id SERIAL PRIMARY KEY,
    vehicle_type VARCHAR(50) NOT NULL,
    inspection_type VARCHAR(50) NOT NULL,
    cycle_order INTEGER NOT NULL,  -- 1: 定期, 2: 乙A, 3: 定期, 4: 乙B, 5: 定期, 6: 乙A, 7: 定期, 8: 甲A
    cycle_months INTEGER NOT NULL,  -- 実施間隔（月単位）
    warning_months INTEGER DEFAULT 2,  -- 予告期間（月単位）
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_type, cycle_order)
);

-- 2. 車両別検修計画テーブル
CREATE TABLE IF NOT EXISTS inspections.vehicle_inspection_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES master_data.vehicles(id) ON DELETE CASCADE,
    inspection_type VARCHAR(50) NOT NULL,
    planned_date DATE NOT NULL,
    cycle_order INTEGER,  -- 検査サイクルの順序番号
    base_id INTEGER REFERENCES master_data.bases(id),  -- 実施予定基地
    status VARCHAR(20) DEFAULT 'planned',  -- planned, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 車両別検修実績テーブル
CREATE TABLE IF NOT EXISTS inspections.vehicle_inspection_records (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES master_data.vehicles(id) ON DELETE CASCADE,
    inspection_type VARCHAR(50) NOT NULL,
    inspection_date DATE NOT NULL,
    cycle_order INTEGER,  -- 検査サイクルの順序番号
    base_id INTEGER REFERENCES master_data.bases(id),  -- 実施基地
    inspector_name VARCHAR(100),
    result VARCHAR(20) DEFAULT 'pass',  -- pass, fail, conditional
    findings TEXT,  -- 所見
    next_inspection_date DATE,  -- 次回検査予定日
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_inspection_cycle_order_vehicle ON inspections.inspection_cycle_order(vehicle_type);
CREATE INDEX idx_vehicle_inspection_plans_vehicle ON inspections.vehicle_inspection_plans(vehicle_id);
CREATE INDEX idx_vehicle_inspection_plans_date ON inspections.vehicle_inspection_plans(planned_date);
CREATE INDEX idx_vehicle_inspection_records_vehicle ON inspections.vehicle_inspection_records(vehicle_id);
CREATE INDEX idx_vehicle_inspection_records_date ON inspections.vehicle_inspection_records(inspection_date);

-- トリガー
CREATE TRIGGER update_inspection_cycle_order_updated_at 
    BEFORE UPDATE ON inspections.inspection_cycle_order 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_inspection_plans_updated_at 
    BEFORE UPDATE ON inspections.vehicle_inspection_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_inspection_records_updated_at 
    BEFORE UPDATE ON inspections.vehicle_inspection_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- サンプルデータ：検査サイクル順序（モータカー）
-- =========================================
INSERT INTO inspections.inspection_cycle_order (vehicle_type, inspection_type, cycle_order, cycle_months, warning_months, description) VALUES
('モータカー', '定期検査', 1, 1, 2, '1か月ごとの定期検査'),
('モータカー', '乙A検査', 2, 12, 2, '1年ごとの乙A検査'),
('モータカー', '定期検査', 3, 1, 2, '1か月ごとの定期検査'),
('モータカー', '乙B検査', 4, 24, 2, '2年ごとの乙B検査'),
('モータカー', '定期検査', 5, 1, 2, '1か月ごとの定期検査'),
('モータカー', '乙A検査', 6, 12, 2, '1年ごとの乙A検査'),
('モータカー', '定期検査', 7, 1, 2, '1か月ごとの定期検査'),
('モータカー', '甲A検査', 8, 36, 2, '3年ごとの甲A検査')
ON CONFLICT (vehicle_type, cycle_order) DO NOTHING;

-- =========================================
-- サンプルデータ：検査サイクル順序（鉄トロ）
-- =========================================
INSERT INTO inspections.inspection_cycle_order (vehicle_type, inspection_type, cycle_order, cycle_months, warning_months, description) VALUES
('鉄トロ（15t）', '定期検査', 1, 1, 2, '1か月ごとの定期検査'),
('鉄トロ（15t）', '乙A検査', 2, 12, 2, '1年ごとの乙A検査'),
('鉄トロ（15t）', '定期検査', 3, 1, 2, '1か月ごとの定期検査'),
('鉄トロ（15t）', '乙B検査', 4, 24, 2, '2年ごとの乙B検査'),
('鉄トロ（15t）', '定期検査', 5, 1, 2, '1か月ごとの定期検査'),
('鉄トロ（15t）', '乙A検査', 6, 12, 2, '1年ごとの乙A検査'),
('鉄トロ（15t）', '定期検査', 7, 1, 2, '1か月ごとの定期検査'),
('鉄トロ（15t）', '甲A検査', 8, 36, 2, '3年ごとの甲A検査')
ON CONFLICT (vehicle_type, cycle_order) DO NOTHING;

-- =========================================
-- サンプルデータ：初回検査実績（基準日設定）
-- =========================================
-- モータカー M001の前回検査実績
INSERT INTO inspections.vehicle_inspection_records (
    vehicle_id, 
    inspection_type, 
    inspection_date, 
    cycle_order, 
    result, 
    findings,
    next_inspection_date
)
SELECT 
    v.id,
    '定期検査',
    '2025-11-15'::DATE,
    1,
    'pass',
    '正常',
    '2025-12-15'::DATE
FROM master_data.vehicles v
WHERE v.machine_number = 'M001'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE inspections.inspection_cycle_order IS '検査サイクル順序マスタ - 機種ごとの検査サイクルを定義';
COMMENT ON TABLE inspections.vehicle_inspection_plans IS '車両別検修計画 - 車両ごとの検査計画を管理';
COMMENT ON TABLE inspections.vehicle_inspection_records IS '車両別検修実績 - 車両ごとの検査実績を記録';
