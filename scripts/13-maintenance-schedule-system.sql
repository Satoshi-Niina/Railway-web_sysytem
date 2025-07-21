-- 検修周期マスタテーブル
CREATE TABLE IF NOT EXISTS maintenance_cycles (
  id SERIAL PRIMARY KEY,
  vehicle_type VARCHAR(50) NOT NULL, -- 機種名
  cycle_type VARCHAR(50) NOT NULL, -- 検修種別（日検、月検、年検など）
  cycle_days INTEGER NOT NULL, -- 周期（日数）
  cycle_distance DECIMAL(10,2), -- 走行距離周期（km）
  maintenance_duration INTEGER DEFAULT 1, -- 検修所要日数
  advance_notice_days INTEGER DEFAULT 7, -- 事前通知日数
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 検修実績テーブル
CREATE TABLE IF NOT EXISTS maintenance_records (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) NOT NULL,
  scheduled_date DATE NOT NULL,
  actual_start_date DATE,
  actual_end_date DATE,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'postponed', 'cancelled')),
  mileage_at_maintenance DECIMAL(10,2),
  notes TEXT,
  auto_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 月次検修計画テーブル
CREATE TABLE IF NOT EXISTS monthly_maintenance_plans (
  id SERIAL PRIMARY KEY,
  target_month DATE NOT NULL, -- 対象月（月初日）
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) NOT NULL,
  planned_date DATE NOT NULL,
  priority INTEGER DEFAULT 1, -- 優先度（1:高、2:中、3:低）
  estimated_duration INTEGER DEFAULT 1,
  base_id INTEGER REFERENCES bases(id),
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  auto_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_maintenance_cycles_vehicle_type ON maintenance_cycles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_vehicle_date ON maintenance_records(vehicle_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_monthly_maintenance_plans_month ON monthly_maintenance_plans(target_month);

-- 機種別検修周期のサンプルデータ
INSERT INTO maintenance_cycles (vehicle_type, cycle_type, cycle_days, cycle_distance, maintenance_duration, advance_notice_days) VALUES
-- モータカー
('モータカー', '日常点検', 1, NULL, 1, 0),
('モータカー', '週間点検', 7, NULL, 1, 1),
('モータカー', '月次点検', 30, 1000, 2, 7),
('モータカー', '3ヶ月点検', 90, 3000, 3, 14),
('モータカー', '6ヶ月点検', 180, 6000, 5, 21),
('モータカー', '年次検査', 365, 12000, 10, 30),

-- 鉄トロ
('鉄トロ', '日常点検', 1, NULL, 1, 0),
('鉄トロ', '週間点検', 7, NULL, 1, 1),
('鉄トロ', '月次点検', 30, 800, 2, 7),
('鉄トロ', '3ヶ月点検', 90, 2400, 3, 14),
('鉄トロ', '6ヶ月点検', 180, 4800, 4, 21),
('鉄トロ', '年次検査', 365, 9600, 8, 30),

-- ホッパー
('ホッパー', '日常点検', 1, NULL, 1, 0),
('ホッパー', '週間点検', 7, NULL, 1, 1),
('ホッパー', '月次点検', 30, 1200, 2, 7),
('ホッパー', '3ヶ月点検', 90, 3600, 4, 14),
('ホッパー', '6ヶ月点検', 180, 7200, 6, 21),
('ホッパー', '年次検査', 365, 14400, 12, 30);

-- 検修計画自動生成用のストアドプロシージャ
CREATE OR REPLACE FUNCTION generate_monthly_maintenance_plans(target_month_param DATE)
RETURNS INTEGER AS $$
DECLARE
    vehicle_record RECORD;
    cycle_record RECORD;
    last_maintenance_date DATE;
    next_maintenance_date DATE;
    plans_generated INTEGER := 0;
    target_month_start DATE;
    target_month_end DATE;
BEGIN
    -- 対象月の開始日と終了日を計算
    target_month_start := DATE_TRUNC('month', target_month_param);
    target_month_end := target_month_start + INTERVAL '1 month' - INTERVAL '1 day';
    
    -- 既存の自動生成計画を削除
    DELETE FROM monthly_maintenance_plans 
    WHERE target_month = target_month_start AND auto_generated = TRUE;
    
    -- 全車両に対してループ
    FOR vehicle_record IN 
        SELECT id, name, machine_number, base_location 
        FROM vehicles 
        WHERE name IS NOT NULL
    LOOP
        -- 車両の機種に対応する検修周期を取得
        FOR cycle_record IN 
            SELECT * FROM maintenance_cycles 
            WHERE vehicle_type = vehicle_record.name AND is_active = TRUE
            ORDER BY cycle_days
        LOOP
            -- 最後の検修実施日を取得
            SELECT COALESCE(MAX(actual_start_date), MAX(scheduled_date), CURRENT_DATE - INTERVAL '1 year')
            INTO last_maintenance_date
            FROM maintenance_records 
            WHERE vehicle_id = vehicle_record.id 
            AND maintenance_type = cycle_record.cycle_type;
            
            -- 次回検修予定日を計算
            next_maintenance_date := last_maintenance_date + (cycle_record.cycle_days || ' days')::INTERVAL;
            
            -- 対象月内に検修が必要な場合、計画を生成
            IF next_maintenance_date >= target_month_start AND next_maintenance_date <= target_month_end THEN
                INSERT INTO monthly_maintenance_plans (
                    target_month,
                    vehicle_id,
                    maintenance_type,
                    planned_date,
                    priority,
                    estimated_duration,
                    status,
                    auto_generated
                ) VALUES (
                    target_month_start,
                    vehicle_record.id,
                    cycle_record.cycle_type,
                    next_maintenance_date,
                    CASE 
                        WHEN cycle_record.cycle_type LIKE '%年次%' THEN 1
                        WHEN cycle_record.cycle_type LIKE '%6ヶ月%' THEN 2
                        WHEN cycle_record.cycle_type LIKE '%3ヶ月%' THEN 2
                        ELSE 3
                    END,
                    cycle_record.maintenance_duration,
                    'planned',
                    TRUE
                );
                
                plans_generated := plans_generated + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN plans_generated;
END;
$$ LANGUAGE plpgsql;

-- 来月の検修計画を自動生成（サンプル）
SELECT generate_monthly_maintenance_plans(DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'));
