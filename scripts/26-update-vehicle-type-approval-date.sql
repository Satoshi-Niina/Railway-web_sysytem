-- 型式認定有効起算日を年月形式に変更

-- 1. 既存のデータを年月形式に変換（YYYY-MM-DD → YYYY-MM）
UPDATE vehicles 
SET type_approval_start_date = TO_CHAR(type_approval_start_date::date, 'YYYY-MM')
WHERE type_approval_start_date IS NOT NULL;

-- 2. カラムの型をVARCHAR(7)に変更
ALTER TABLE vehicles 
ALTER COLUMN type_approval_start_date TYPE VARCHAR(7);

-- 3. コメントを更新
COMMENT ON COLUMN vehicles.type_approval_start_date IS '型式認定有効起算日（YYYY-MM形式）';

-- 4. 変更確認
SELECT 
    machine_number,
    type_approval_start_date,
    LENGTH(type_approval_start_date) as date_length
FROM vehicles 
WHERE type_approval_start_date IS NOT NULL
LIMIT 5; 