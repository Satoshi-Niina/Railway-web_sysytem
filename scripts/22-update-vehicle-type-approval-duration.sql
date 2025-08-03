-- 保守用車マスタの型式認定有効期間を日から月に変更
-- 既存のデータを日数から月数に変換（30日を1ヶ月として計算）

-- コメントを更新
COMMENT ON COLUMN vehicles.type_approval_duration IS '型式認定有効期間（月数）';

-- 既存のデータを日数から月数に変換（30日を1ヶ月として計算）
UPDATE vehicles 
SET type_approval_duration = CASE 
    WHEN type_approval_duration IS NOT NULL THEN 
        GREATEST(1, ROUND(type_approval_duration / 30.0))
    ELSE 12  -- デフォルト値を12ヶ月に設定
END
WHERE type_approval_duration IS NOT NULL;

-- デフォルト値を12ヶ月に設定
UPDATE vehicles 
SET type_approval_duration = 12 
WHERE type_approval_duration IS NULL;

-- インデックスを再作成
DROP INDEX IF EXISTS idx_vehicles_type_approval_duration;
CREATE INDEX IF NOT EXISTS idx_vehicles_type_approval_duration ON vehicles(type_approval_duration);

-- 変更確認
SELECT 
    id, 
    machine_number, 
    vehicle_type, 
    type_approval_duration,
    CASE 
        WHEN type_approval_duration IS NOT NULL THEN 
            type_approval_duration || 'ヶ月'
        ELSE '未設定'
    END as duration_display
FROM vehicles 
ORDER BY id; 