-- 車両マスタから所属保守基地フィールドを削除

-- 1. home_base_idカラムを削除
ALTER TABLE vehicles DROP COLUMN IF EXISTS home_base_id;

-- 2. 関連するインデックスを削除
DROP INDEX IF EXISTS idx_vehicles_base_id;

-- 3. 変更確認
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
ORDER BY ordinal_position;

-- 4. サンプルデータの確認
SELECT 
    id,
    machine_number,
    vehicle_type,
    management_office_id,
    office_name
FROM vehicles v
LEFT JOIN management_offices mo ON v.management_office_id = mo.id
ORDER BY id; 