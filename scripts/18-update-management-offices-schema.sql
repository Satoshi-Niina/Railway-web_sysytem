-- 事業所テーブルのスキーマ更新
-- 新しいカラムを追加して事業所管理機能を強化

-- PostgreSQL用
-- 既存のmanagement_officesテーブルに新しいカラムを追加

-- 1. 新しいカラムを追加
ALTER TABLE management_offices 
ADD COLUMN IF NOT EXISTS maintenance_office_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS managed_vehicle_ids JSONB,
ADD COLUMN IF NOT EXISTS maintenance_base_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. 既存データの更新（サンプルデータ）
UPDATE management_offices 
SET 
  maintenance_office_name = CASE 
    WHEN office_name LIKE '%本社%' THEN '東京保線作業所'
    WHEN office_name LIKE '%関西%' THEN '大阪保線作業所'
    ELSE '保線作業所'
  END,
  managed_vehicle_ids = CASE 
    WHEN office_name LIKE '%本社%' THEN '["MC001", "MC002", "TT001"]'::jsonb
    WHEN office_name LIKE '%関西%' THEN '["MC003", "HP001"]'::jsonb
    ELSE '[]'::jsonb
  END,
  maintenance_base_name = CASE 
    WHEN office_name LIKE '%本社%' THEN '本社保守基地'
    WHEN office_name LIKE '%関西%' THEN '関西保守基地'
    ELSE '保守基地'
  END,
  contact_person = CASE 
    WHEN office_name LIKE '%本社%' THEN '田中太郎'
    WHEN office_name LIKE '%関西%' THEN '佐藤花子'
    ELSE '担当者'
  END,
  contact_phone = CASE 
    WHEN office_name LIKE '%本社%' THEN '03-1234-5678'
    WHEN office_name LIKE '%関西%' THEN '06-1234-5678'
    ELSE ''
  END,
  contact_email = CASE 
    WHEN office_name LIKE '%本社%' THEN 'tanaka@example.com'
    WHEN office_name LIKE '%関西%' THEN 'sato@example.com'
    ELSE ''
  END,
  address = CASE 
    WHEN office_name LIKE '%本社%' THEN '東京都渋谷区○○1-1-1'
    WHEN office_name LIKE '%関西%' THEN '大阪府大阪市○○2-2-2'
    ELSE ''
  END,
  is_active = true
WHERE maintenance_office_name IS NULL;

-- 3. インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_management_offices_office_code ON management_offices(office_code);
CREATE INDEX IF NOT EXISTS idx_management_offices_is_active ON management_offices(is_active);
CREATE INDEX IF NOT EXISTS idx_management_offices_responsible_area ON management_offices(responsible_area);

-- 4. 制約の追加
ALTER TABLE management_offices 
ADD CONSTRAINT IF NOT EXISTS chk_management_offices_contact_email 
CHECK (contact_email = '' OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE management_offices 
ADD CONSTRAINT IF NOT EXISTS chk_management_offices_contact_phone 
CHECK (contact_phone = '' OR contact_phone ~ '^[0-9-+()\s]+$');

-- 5. コメントの追加
COMMENT ON COLUMN management_offices.maintenance_office_name IS '保線作業所名';
COMMENT ON COLUMN management_offices.managed_vehicle_ids IS '管理保守用車番号ID（JSON配列）';
COMMENT ON COLUMN management_offices.maintenance_base_name IS '管理保守基地';
COMMENT ON COLUMN management_offices.contact_person IS '担当者名';
COMMENT ON COLUMN management_offices.contact_phone IS '連絡先電話番号';
COMMENT ON COLUMN management_offices.contact_email IS '連絡先メールアドレス';
COMMENT ON COLUMN management_offices.address IS '住所';
COMMENT ON COLUMN management_offices.is_active IS 'アクティブ状態';

-- 6. ビューの作成（よく使用されるクエリ用）
CREATE OR REPLACE VIEW active_management_offices AS
SELECT 
  id,
  office_name,
  office_code,
  responsible_area,
  maintenance_office_name,
  maintenance_base_name,
  contact_person,
  contact_phone,
  contact_email,
  address,
  created_at,
  updated_at
FROM management_offices 
WHERE is_active = true
ORDER BY office_name;

-- 7. サンプルデータの挿入（既存データがない場合）
INSERT INTO management_offices (
  office_name, 
  office_code, 
  responsible_area, 
  maintenance_office_name,
  managed_vehicle_ids,
  maintenance_base_name,
  contact_person,
  contact_phone,
  contact_email,
  address,
  is_active
) 
SELECT 
  '本社保守事業所',
  'HQ001',
  '関東エリア',
  '東京保線作業所',
  '["MC001", "MC002", "TT001"]'::jsonb,
  '本社保守基地',
  '田中太郎',
  '03-1234-5678',
  'tanaka@example.com',
  '東京都渋谷区○○1-1-1',
  true
WHERE NOT EXISTS (SELECT 1 FROM management_offices WHERE office_code = 'HQ001');

INSERT INTO management_offices (
  office_name, 
  office_code, 
  responsible_area, 
  maintenance_office_name,
  managed_vehicle_ids,
  maintenance_base_name,
  contact_person,
  contact_phone,
  contact_email,
  address,
  is_active
) 
SELECT 
  '関西支社保守事業所',
  'KS001',
  '関西エリア',
  '大阪保線作業所',
  '["MC003", "HP001"]'::jsonb,
  '関西保守基地',
  '佐藤花子',
  '06-1234-5678',
  'sato@example.com',
  '大阪府大阪市○○2-2-2',
  true
WHERE NOT EXISTS (SELECT 1 FROM management_offices WHERE office_code = 'KS001');

-- 完了メッセージ
SELECT 'Management offices schema updated successfully!' as status; 