-- 保守基地テーブルの作成と事業所テーブルの更新
-- 事業所から不要なカラムを削除し、保守基地を別テーブルに分離

-- PostgreSQL用

-- 1. 事業所テーブルから不要なカラムを削除
ALTER TABLE management_offices 
DROP COLUMN IF EXISTS maintenance_office_name,
DROP COLUMN IF EXISTS managed_vehicle_ids,
DROP COLUMN IF EXISTS maintenance_base_name,
DROP COLUMN IF EXISTS contact_person,
DROP COLUMN IF EXISTS contact_phone,
DROP COLUMN IF EXISTS contact_email,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS responsible_area;

-- 1-1. 事業所テーブルに駅名カラムを追加
ALTER TABLE management_offices 
ADD COLUMN IF NOT EXISTS station_1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS station_2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS station_3 VARCHAR(255),
ADD COLUMN IF NOT EXISTS station_4 VARCHAR(255),
ADD COLUMN IF NOT EXISTS station_5 VARCHAR(255),
ADD COLUMN IF NOT EXISTS station_6 VARCHAR(255);

-- 2. 保守基地テーブルの作成
CREATE TABLE IF NOT EXISTS maintenance_bases (
  id SERIAL PRIMARY KEY,
  base_name VARCHAR(255) NOT NULL,
  base_code VARCHAR(50) NOT NULL UNIQUE,
  management_office_id INTEGER NOT NULL REFERENCES management_offices(id) ON DELETE CASCADE,
  location VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_maintenance_bases_management_office_id ON maintenance_bases(management_office_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_bases_base_code ON maintenance_bases(base_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_bases_location ON maintenance_bases(location);

-- 4. 制約の追加（必要に応じて）

-- 5. コメントの追加
COMMENT ON TABLE maintenance_bases IS '保守基地テーブル';
COMMENT ON COLUMN maintenance_bases.base_name IS '基地名';
COMMENT ON COLUMN maintenance_bases.base_code IS '基地コード';
COMMENT ON COLUMN maintenance_bases.management_office_id IS '管理事業所ID';
COMMENT ON COLUMN maintenance_bases.location IS '所在地';
COMMENT ON COLUMN maintenance_bases.address IS '住所';

COMMENT ON TABLE management_offices IS '管理事業所テーブル';
COMMENT ON COLUMN management_offices.station_1 IS '担当駅1';
COMMENT ON COLUMN management_offices.station_2 IS '担当駅2';
COMMENT ON COLUMN management_offices.station_3 IS '担当駅3';
COMMENT ON COLUMN management_offices.station_4 IS '担当駅4';
COMMENT ON COLUMN management_offices.station_5 IS '担当駅5';
COMMENT ON COLUMN management_offices.station_6 IS '担当駅6';

-- 6. サンプルデータの挿入
INSERT INTO maintenance_bases (
  base_name, 
  base_code, 
  management_office_id,
  location,
  address
) 
SELECT 
  '本社保守基地',
  'HQ-BASE001',
  1,
  '東京',
  '東京都渋谷区○○1-1-1'
WHERE NOT EXISTS (SELECT 1 FROM maintenance_bases WHERE base_code = 'HQ-BASE001');

INSERT INTO maintenance_bases (
  base_name, 
  base_code, 
  management_office_id,
  location,
  address
) 
SELECT 
  '品川保守基地',
  'HQ-BASE002',
  1,
  '東京',
  '東京都品川区○○2-2-2'
WHERE NOT EXISTS (SELECT 1 FROM maintenance_bases WHERE base_code = 'HQ-BASE002');

INSERT INTO maintenance_bases (
  base_name, 
  base_code, 
  management_office_id,
  location,
  address
) 
SELECT 
  '関西保守基地',
  'KS-BASE001',
  2,
  '大阪',
  '大阪府大阪市○○3-3-3'
WHERE NOT EXISTS (SELECT 1 FROM maintenance_bases WHERE base_code = 'KS-BASE001');

-- 7. 車両テーブルに保守基地とのリレーションを追加（既存のhome_base_idを活用）
-- 必要に応じて、車両テーブルにmaintenance_base_idカラムを追加
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS maintenance_base_id INTEGER REFERENCES maintenance_bases(id);

-- 8. ビューの作成
CREATE OR REPLACE VIEW maintenance_bases_with_offices AS
SELECT 
  mb.id,
  mb.base_name,
  mb.base_code,
  mb.location,
  mb.address,
  mb.created_at,
  mb.updated_at,
  mo.office_name as management_office_name,
  mo.office_code as management_office_code
FROM maintenance_bases mb
LEFT JOIN management_offices mo ON mb.management_office_id = mo.id
ORDER BY mb.base_name;

-- 9. トリガー関数の作成（updated_atの自動更新）
CREATE OR REPLACE FUNCTION update_maintenance_bases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. トリガーの作成
DROP TRIGGER IF EXISTS trigger_update_maintenance_bases_updated_at ON maintenance_bases;
CREATE TRIGGER trigger_update_maintenance_bases_updated_at
  BEFORE UPDATE ON maintenance_bases
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_bases_updated_at();

-- 完了メッセージ
SELECT 'Maintenance bases schema created and management offices updated successfully!' as status; 