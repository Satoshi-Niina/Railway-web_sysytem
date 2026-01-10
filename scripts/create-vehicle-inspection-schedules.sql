-- 車両検査スケジュールテーブルの作成
-- 機械番号（車両）と検査種別をリンクするテーブル

-- テーブルが存在する場合は削除
DROP TABLE IF EXISTS master_data.vehicle_inspection_schedules CASCADE;

-- 車両検査スケジュールテーブルの作成
CREATE TABLE master_data.vehicle_inspection_schedules (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES master_data.vehicles(id) ON DELETE CASCADE,
  inspection_type_id INTEGER NOT NULL REFERENCES master_data.inspection_types(id) ON DELETE RESTRICT,
  last_inspection_date DATE,
  next_inspection_date DATE,
  interval_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vehicle_id, inspection_type_id)
);

-- インデックスの作成
CREATE INDEX idx_vehicle_inspection_schedules_vehicle ON master_data.vehicle_inspection_schedules(vehicle_id);
CREATE INDEX idx_vehicle_inspection_schedules_inspection_type ON master_data.vehicle_inspection_schedules(inspection_type_id);
CREATE INDEX idx_vehicle_inspection_schedules_next_date ON master_data.vehicle_inspection_schedules(next_inspection_date);
CREATE INDEX idx_vehicle_inspection_schedules_active ON master_data.vehicle_inspection_schedules(is_active);

-- トリガーの作成
CREATE TRIGGER update_vehicle_inspection_schedules_updated_at
  BEFORE UPDATE ON master_data.vehicle_inspection_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメントの追加
COMMENT ON TABLE master_data.vehicle_inspection_schedules IS '車両検査スケジュール管理テーブル';
COMMENT ON COLUMN master_data.vehicle_inspection_schedules.vehicle_id IS '車両ID';
COMMENT ON COLUMN master_data.vehicle_inspection_schedules.inspection_type_id IS '検査種別ID';
COMMENT ON COLUMN master_data.vehicle_inspection_schedules.last_inspection_date IS '最終検査日';
COMMENT ON COLUMN master_data.vehicle_inspection_schedules.next_inspection_date IS '次回検査予定日';
COMMENT ON COLUMN master_data.vehicle_inspection_schedules.interval_days IS '検査周期（日数）';
COMMENT ON COLUMN master_data.vehicle_inspection_schedules.is_active IS 'アクティブフラグ';
COMMENT ON COLUMN master_data.vehicle_inspection_schedules.notes IS '備考';

-- サンプルデータの挿入（オプション）
-- 例: 車両ID 1に対して、日検査（ID 1）を設定
-- INSERT INTO master_data.vehicle_inspection_schedules 
--   (vehicle_id, inspection_type_id, last_inspection_date, next_inspection_date, interval_days)
-- VALUES 
--   (1, 1, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE, 1);

