-- Step 1: Copy current 'name' (例: 'モータカー001') to 'machine_number'
-- これにより、既存の machine_number の値（例: 'M001'）は上書きされます。
-- machine_number は既に UNIQUE 制約が設定されています。
UPDATE vehicles SET machine_number = name;

-- Step 2: Copy current 'category' (例: 'モータカー') to 'name'
UPDATE vehicles SET name = category;

-- Step 3: Drop the 'category' column
ALTER TABLE vehicles DROP COLUMN category;
