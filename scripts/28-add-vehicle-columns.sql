-- vehiclesテーブルに必要なカラムを追加

-- 1. 取得年月をVARCHAR(7)に変更（YYYY-MM形式）
ALTER TABLE vehicles 
ALTER COLUMN acquisition_date TYPE VARCHAR(7);

-- 2. 型式認定有効起算日カラムを追加（YYYY-MM形式）
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS type_approval_start_date VARCHAR(7);

-- 3. 型式認定有効期間（月数）カラムを追加
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS type_approval_duration INTEGER DEFAULT 12;

-- 4. 特記事項カラムを追加
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS special_notes TEXT;

-- 5. コメントを追加
COMMENT ON COLUMN vehicles.acquisition_date IS '取得年月（YYYY-MM形式）';
COMMENT ON COLUMN vehicles.type_approval_start_date IS '型式認定有効起算日（YYYY-MM形式）';
COMMENT ON COLUMN vehicles.type_approval_duration IS '型式認定有効期間（月数）';
COMMENT ON COLUMN vehicles.special_notes IS '特記事項';

-- 6. 修正後のテーブル構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
ORDER BY ordinal_position; 