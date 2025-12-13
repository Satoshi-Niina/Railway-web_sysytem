-- 運用実績テーブルにis_as_plannedカラムを追加
-- 計画通りの実績かどうかを識別するためのフラグ

-- is_as_plannedカラムを追加（デフォルトはfalse）
ALTER TABLE operations.operation_records 
ADD COLUMN IF NOT EXISTS is_as_planned BOOLEAN DEFAULT false;

-- 既存のデータは全てfalseとして扱う（計画外として扱う）
-- 必要に応じて、手動で計画通りの実績にtrueを設定できます

-- カラムにコメントを追加
COMMENT ON COLUMN operations.operation_records.is_as_planned IS '計画通りの実績かどうか（true: 計画通り, false: 計画外）';

-- 確認用クエリ
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'operations' 
  AND table_name = 'operation_records' 
  AND column_name = 'is_as_planned';
