-- vehiclesテーブルの外部キー制約を修正

-- 1. 外部キー制約の確認
SELECT 
    tc.constraint_name,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='vehicles';

-- 2. 不要な外部キー制約を削除（basesテーブルが存在しないため）
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_home_base_id_fkey;

-- 3. home_base_idカラムを削除（不要なため）
ALTER TABLE vehicles DROP COLUMN IF EXISTS home_base_id;

-- 4. 修正後のテーブル構造を確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
ORDER BY ordinal_position;

-- 5. 外部キー制約を再確認
SELECT 
    tc.constraint_name,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='vehicles'; 