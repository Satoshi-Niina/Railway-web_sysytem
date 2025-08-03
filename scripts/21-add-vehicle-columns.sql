-- 保守用車マスタに新しいカラムを追加
-- 既存のカラムを確認し、不足しているカラムのみを追加

-- 1. 製造メーカーカラムの追加（既に存在する場合はスキップ）
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100);

-- 2. 取得年月日カラムの追加（既に存在する場合はスキップ）
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS acquisition_date DATE;

-- 3. 型式認定有効起算日カラムの追加
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS type_approval_start_date DATE;

-- 4. 型式認定有効期間カラムの追加
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS type_approval_duration INTEGER;

-- 5. 特記事項カラムの追加
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS special_notes TEXT;

-- 6. コメントの追加
COMMENT ON COLUMN vehicles.manufacturer IS '製造メーカー';
COMMENT ON COLUMN vehicles.acquisition_date IS '取得年月日';
COMMENT ON COLUMN vehicles.type_approval_start_date IS '型式認定有効起算日';
COMMENT ON COLUMN vehicles.type_approval_duration IS '型式認定有効期間（日数）';
COMMENT ON COLUMN vehicles.special_notes IS '特記事項';

-- 7. 既存データのサンプル更新（テスト用）
-- 注意: 実際の運用では、既存データに合わせて適切な値を設定してください
UPDATE vehicles 
SET 
  manufacturer = CASE 
    WHEN manufacturer IS NULL THEN '鉄道車両製造株式会社'
    ELSE manufacturer
  END,
  acquisition_date = CASE 
    WHEN acquisition_date IS NULL THEN '2020-01-01'
    ELSE acquisition_date
  END,
  type_approval_start_date = CASE 
    WHEN type_approval_start_date IS NULL THEN acquisition_date
    ELSE type_approval_start_date
  END,
  type_approval_duration = CASE 
    WHEN type_approval_duration IS NULL THEN 365
    ELSE type_approval_duration
  END,
  special_notes = CASE 
    WHEN special_notes IS NULL THEN '特になし'
    ELSE special_notes
  END
WHERE manufacturer IS NULL 
   OR acquisition_date IS NULL 
   OR type_approval_start_date IS NULL 
   OR type_approval_duration IS NULL
   OR special_notes IS NULL;

-- 8. インデックスの作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_vehicles_manufacturer ON vehicles(manufacturer);
CREATE INDEX IF NOT EXISTS idx_vehicles_acquisition_date ON vehicles(acquisition_date);
CREATE INDEX IF NOT EXISTS idx_vehicles_type_approval_start_date ON vehicles(type_approval_start_date);
CREATE INDEX IF NOT EXISTS idx_vehicles_type_approval_duration ON vehicles(type_approval_duration);

-- 9. 完了メッセージ
SELECT 'Vehicle table columns added successfully!' as status; 