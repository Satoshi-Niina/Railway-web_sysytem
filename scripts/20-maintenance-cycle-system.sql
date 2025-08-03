-- 検修周期マスタシステムの実装
-- 運用計画で検修予定を表示するための基盤

-- 1. 検修周期マスタテーブルの作成
CREATE TABLE IF NOT EXISTS maintenance_cycles (
    id SERIAL PRIMARY KEY,
    vehicle_type VARCHAR(50) NOT NULL,
    inspection_type VARCHAR(50) NOT NULL,
    cycle_days INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_type, inspection_type)
);

-- 2. 月次検修計画テーブルの作成
CREATE TABLE IF NOT EXISTS monthly_maintenance_plans (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    plan_month VARCHAR(7) NOT NULL, -- YYYY-MM形式
    inspection_type VARCHAR(50) NOT NULL,
    planned_date DATE,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'postponed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 車両の最終検修日テーブル（検修周期計算用）
CREATE TABLE IF NOT EXISTS vehicle_last_inspections (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    inspection_type VARCHAR(50) NOT NULL,
    last_inspection_date DATE NOT NULL,
    next_inspection_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, inspection_type)
);

-- 4. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_maintenance_cycles_vehicle_type ON maintenance_cycles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_cycles_is_active ON maintenance_cycles(is_active);
CREATE INDEX IF NOT EXISTS idx_monthly_maintenance_plans_month ON monthly_maintenance_plans(plan_month);
CREATE INDEX IF NOT EXISTS idx_monthly_maintenance_plans_vehicle ON monthly_maintenance_plans(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_last_inspections_vehicle ON vehicle_last_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_last_inspections_next_date ON vehicle_last_inspections(next_inspection_date);

-- 5. 検修周期マスタデータの投入
INSERT INTO maintenance_cycles (vehicle_type, inspection_type, cycle_days, description) VALUES
-- モータカー
('モータカー', '甲A検査', 365, '年次検査'),
('モータカー', '甲B検査', 180, '半年検査'),
('モータカー', '乙A検査', 90, '3ヶ月検査'),
('モータカー', '乙B検査', 30, '月次検査'),
('モータカー', '定検', 7, '週次点検'),

-- MCR
('MCR', '甲A検査', 365, '年次検査'),
('MCR', '甲B検査', 180, '半年検査'),
('MCR', '乙A検査', 90, '3ヶ月検査'),
('MCR', '乙B検査', 30, '月次検査'),
('MCR', '定検', 7, '週次点検'),

-- 鉄トロ（10t）
('鉄トロ（10t）', '甲A検査', 365, '年次検査'),
('鉄トロ（10t）', '甲B検査', 180, '半年検査'),
('鉄トロ（10t）', '乙A検査', 90, '3ヶ月検査'),
('鉄トロ（10t）', '乙B検査', 30, '月次検査'),
('鉄トロ（10t）', '定検', 7, '週次点検'),

-- 鉄トロ（15t）
('鉄トロ（15t）', '甲A検査', 365, '年次検査'),
('鉄トロ（15t）', '甲B検査', 180, '半年検査'),
('鉄トロ（15t）', '乙A検査', 90, '3ヶ月検査'),
('鉄トロ（15t）', '乙B検査', 30, '月次検査'),
('鉄トロ（15t）', '定検', 7, '週次点検'),

-- 箱トロ
('箱トロ', '甲A検査', 365, '年次検査'),
('箱トロ', '甲B検査', 180, '半年検査'),
('箱トロ', '乙A検査', 90, '3ヶ月検査'),
('箱トロ', '乙B検査', 30, '月次検査'),
('箱トロ', '定検', 7, '週次点検'),

-- ホッパー車
('ホッパー車', '甲A検査', 365, '年次検査'),
('ホッパー車', '甲B検査', 180, '半年検査'),
('ホッパー車', '乙A検査', 90, '3ヶ月検査'),
('ホッパー車', '乙B検査', 30, '月次検査'),
('ホッパー車', '定検', 7, '週次点検');

-- 6. 車両の初期検修日データ（サンプル）
INSERT INTO vehicle_last_inspections (vehicle_id, inspection_type, last_inspection_date, next_inspection_date) VALUES
-- モータカーM001
(1, '甲A検査', '2023-12-15', '2024-12-15'),
(1, '甲B検査', '2023-06-15', '2024-06-15'),
(1, '乙A検査', '2023-10-15', '2024-01-15'),
(1, '乙B検査', '2023-12-15', '2024-01-15'),
(1, '定検', '2023-12-29', '2024-01-05'),

-- モータカーM002
(2, '甲A検査', '2023-11-20', '2024-11-20'),
(2, '甲B検査', '2023-05-20', '2024-05-20'),
(2, '乙A検査', '2023-11-20', '2024-02-20'),
(2, '乙B検査', '2023-12-20', '2024-01-20'),
(2, '定検', '2023-12-30', '2024-01-06'),

-- MCR001
(3, '甲A検査', '2023-10-10', '2024-10-10'),
(3, '甲B検査', '2023-04-10', '2024-04-10'),
(3, '乙A検査', '2023-10-10', '2024-01-10'),
(3, '乙B検査', '2023-12-10', '2024-01-10'),
(3, '定検', '2023-12-31', '2024-01-07');

-- 7. 月次検修計画自動生成関数
CREATE OR REPLACE FUNCTION generate_monthly_maintenance_plans(target_month_param VARCHAR(7))
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    plan_count INTEGER := 0;
    target_date DATE;
    vehicle_record RECORD;
    cycle_record RECORD;
    next_inspection_date DATE;
    plan_month_start DATE;
    plan_month_end DATE;
BEGIN
    -- 対象月の開始日と終了日を計算
    plan_month_start := (target_month_param || '-01')::DATE;
    plan_month_end := (plan_month_start + INTERVAL '1 month - 1 day')::DATE;
    
    -- 各車両について検修周期をチェック
    FOR vehicle_record IN 
        SELECT v.id, v.vehicle_type, v.machine_number
        FROM vehicles v
        WHERE v.status = 'active'
    LOOP
        -- 各検修種別について周期をチェック
        FOR cycle_record IN 
            SELECT mc.inspection_type, mc.cycle_days, vli.next_inspection_date
            FROM maintenance_cycles mc
            LEFT JOIN vehicle_last_inspections vli ON 
                vli.vehicle_id = vehicle_record.id AND 
                vli.inspection_type = mc.inspection_type
            WHERE mc.vehicle_type = vehicle_record.vehicle_type 
            AND mc.is_active = true
        LOOP
            -- 次回検修日が対象月内にあるかチェック
            IF cycle_record.next_inspection_date IS NOT NULL AND
               cycle_record.next_inspection_date BETWEEN plan_month_start AND plan_month_end THEN
                
                -- 既存の計画がないかチェック
                IF NOT EXISTS (
                    SELECT 1 FROM monthly_maintenance_plans 
                    WHERE vehicle_id = vehicle_record.id 
                    AND inspection_type = cycle_record.inspection_type
                    AND plan_month = target_month_param
                ) THEN
                    -- 月次検修計画を作成
                    INSERT INTO monthly_maintenance_plans (
                        vehicle_id, 
                        plan_month, 
                        inspection_type, 
                        planned_date, 
                        status, 
                        notes
                    ) VALUES (
                        vehicle_record.id,
                        target_month_param,
                        cycle_record.inspection_type,
                        cycle_record.next_inspection_date,
                        'planned',
                        '検修周期に基づく自動生成: ' || vehicle_record.machine_number || 'の' || cycle_record.inspection_type
                    );
                    
                    plan_count := plan_count + 1;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN plan_count;
END;
$$;

-- 8. 検修予定表示用ビューの作成
CREATE OR REPLACE VIEW maintenance_schedule_view AS
SELECT 
    mmp.id,
    mmp.vehicle_id,
    v.machine_number,
    v.vehicle_type,
    v.manufacturer,
    mo.office_name as management_office,
    mmp.plan_month,
    mmp.inspection_type,
    mmp.planned_date,
    mmp.status,
    mmp.notes,
    mmp.created_at,
    mmp.updated_at
FROM monthly_maintenance_plans mmp
JOIN vehicles v ON mmp.vehicle_id = v.id
LEFT JOIN management_offices mo ON v.management_office_id = mo.id
ORDER BY mmp.planned_date, v.vehicle_type, v.machine_number;

-- 9. 検修周期管理用ビューの作成
CREATE OR REPLACE VIEW vehicle_inspection_cycle_view AS
SELECT 
    v.id as vehicle_id,
    v.machine_number,
    v.vehicle_type,
    v.manufacturer,
    mo.office_name as management_office,
    mc.inspection_type,
    mc.cycle_days,
    mc.description,
    vli.last_inspection_date,
    vli.next_inspection_date,
    CASE 
        WHEN vli.next_inspection_date < CURRENT_DATE THEN 'overdue'
        WHEN vli.next_inspection_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'normal'
    END as status
FROM vehicles v
JOIN maintenance_cycles mc ON v.vehicle_type = mc.vehicle_type
LEFT JOIN vehicle_last_inspections vli ON 
    vli.vehicle_id = v.id AND 
    vli.inspection_type = mc.inspection_type
LEFT JOIN management_offices mo ON v.management_office_id = mo.id
WHERE v.status = 'active' AND mc.is_active = true
ORDER BY v.vehicle_type, v.machine_number, mc.cycle_days;

-- 10. コメントの追加
COMMENT ON TABLE maintenance_cycles IS '検修周期マスタテーブル';
COMMENT ON COLUMN maintenance_cycles.vehicle_type IS '車両種別';
COMMENT ON COLUMN maintenance_cycles.inspection_type IS '検修種別';
COMMENT ON COLUMN maintenance_cycles.cycle_days IS '検修周期（日数）';
COMMENT ON COLUMN maintenance_cycles.description IS '検修内容の説明';

COMMENT ON TABLE monthly_maintenance_plans IS '月次検修計画テーブル';
COMMENT ON COLUMN monthly_maintenance_plans.plan_month IS '計画月（YYYY-MM形式）';
COMMENT ON COLUMN monthly_maintenance_plans.inspection_type IS '検修種別';
COMMENT ON COLUMN monthly_maintenance_plans.planned_date IS '予定日';

COMMENT ON TABLE vehicle_last_inspections IS '車両最終検修日テーブル';
COMMENT ON COLUMN vehicle_last_inspections.last_inspection_date IS '最終検修日';
COMMENT ON COLUMN vehicle_last_inspections.next_inspection_date IS '次回検修予定日';

COMMENT ON FUNCTION generate_monthly_maintenance_plans IS '月次検修計画を自動生成する関数'; 