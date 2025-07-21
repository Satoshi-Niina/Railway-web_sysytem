-- vehicles テーブルに新しいカラムを追加
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS machine_number VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100),
ADD COLUMN IF NOT EXISTS acquisition_date DATE,
ADD COLUMN IF NOT EXISTS management_office VARCHAR(100),
ADD COLUMN IF NOT EXISTS type_approval_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS type_approval_expiration_date DATE,
ADD COLUMN IF NOT EXISTS type_approval_conditions TEXT;

-- machine_number に NOT NULL 制約を追加する場合 (既存データがある場合は注意)
-- ALTER TABLE vehicles ALTER COLUMN machine_number SET NOT NULL;
