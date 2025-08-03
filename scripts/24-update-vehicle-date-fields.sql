-- 車両マスタの取得年月日フィールドを年月形式に変更

-- 1. 既存の取得年月日データを年月形式に変換
UPDATE vehicles 
SET acquisition_date = CASE 
    WHEN acquisition_date IS NOT NULL AND acquisition_date != '' THEN 
        SUBSTRING(acquisition_date::text, 1, 7) -- YYYY-MM-DDからYYYY-MMを抽出
    ELSE NULL
END
WHERE acquisition_date IS NOT NULL;

-- 2. テーブル定義を変更（PostgreSQLでは直接的な型変更は制限があるため、新しいカラムを作成）
-- まず、新しいカラムを追加
ALTER TABLE vehicles ADD COLUMN acquisition_date_new VARCHAR(7);

-- 既存データを新しいカラムにコピー
UPDATE vehicles 
SET acquisition_date_new = acquisition_date 
WHERE acquisition_date IS NOT NULL;

-- 古いカラムを削除
ALTER TABLE vehicles DROP COLUMN acquisition_date;

-- 新しいカラムをリネーム
ALTER TABLE vehicles RENAME COLUMN acquisition_date_new TO acquisition_date;

-- 3. コメントを更新
COMMENT ON COLUMN vehicles.acquisition_date IS '取得年月（YYYY-MM形式）';

-- 4. 型式認定有効期間の単位を月に統一（既に実行済みの場合はスキップ）
UPDATE vehicles 
SET type_approval_duration = CASE 
    WHEN type_approval_duration IS NOT NULL AND type_approval_duration > 365 THEN 
        GREATEST(1, ROUND(type_approval_duration / 30.0)) -- 日数から月数に変換
    WHEN type_approval_duration IS NULL THEN 12 -- デフォルト値を12ヶ月に設定
    ELSE type_approval_duration -- 既に月数の場合はそのまま
END;

-- 5. 変更確認
SELECT 
    id,
    machine_number,
    vehicle_type,
    acquisition_date,
    type_approval_duration,
    CASE 
        WHEN type_approval_duration IS NOT NULL THEN 
            type_approval_duration || 'ヶ月'
        ELSE '未設定'
    END as duration_display
FROM vehicles 
ORDER BY id; 