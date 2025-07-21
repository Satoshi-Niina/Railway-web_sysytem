-- vehicles テーブルのスキーマ修正
-- category カラムが存在する場合は削除

-- Step 1 category カラムが存在するかチェックして削除
DO $$
BEGIN
    IF EXISTS (
        SELECT1FROM information_schema.columns 
        WHERE table_name = 'vehicles' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE vehicles DROP COLUMN category;
        RAISE NOTICE 'category column dropped from vehicles table';
    ELSE
        RAISE NOTICE 'category column does not exist in vehicles table;    END IF;
END $$;

-- Step 2 新しいカラムが存在しない場合は追加
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS machine_number VARCHAR(100UNIQUE,
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(10
ADD COLUMN IF NOT EXISTS acquisition_date DATE,
ADD COLUMN IF NOT EXISTS management_office VARCHAR(10
ADD COLUMN IF NOT EXISTS type_approval_number VARCHAR(10
ADD COLUMN IF NOT EXISTS type_approval_expiration_date DATE,
ADD COLUMN IF NOT EXISTS type_approval_conditions TEXT;

-- Step 3: インデックスの確認と作成
CREATE INDEX IF NOT EXISTS idx_vehicles_name ON vehicles(name);
CREATE INDEX IF NOT EXISTS idx_vehicles_machine_number ON vehicles(machine_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON vehicles(model);

-- Step 4: 現在のテーブル構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name =vehicles' 
ORDER BY ordinal_position; 