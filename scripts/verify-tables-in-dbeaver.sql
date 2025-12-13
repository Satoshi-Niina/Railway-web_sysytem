-- DBeaver用テーブル確認クエリ
-- このクエリをDBeaverのSQLエディタで実行してテーブルの存在を確認してください

-- 1. すべてのスキーマとテーブルを表示
SELECT 
    table_schema AS "スキーマ",
    table_name AS "テーブル名",
    table_type AS "タイプ"
FROM information_schema.tables 
WHERE table_schema IN ('master_data', 'operations', 'inspections', 'maintenance')
ORDER BY table_schema, table_name;

-- 2. 各スキーマのテーブル数
SELECT 
    table_schema AS "スキーマ",
    COUNT(*) AS "テーブル数"
FROM information_schema.tables 
WHERE table_schema IN ('master_data', 'operations', 'inspections', 'maintenance')
GROUP BY table_schema
ORDER BY table_schema;

-- 3. master_dataスキーマの詳細
SELECT 
    table_name AS "テーブル名",
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'master_data' AND table_name = t.table_name) AS "カラム数"
FROM information_schema.tables t
WHERE table_schema = 'master_data'
ORDER BY table_name;

-- 4. operationsスキーマの詳細
SELECT 
    table_name AS "テーブル名",
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'operations' AND table_name = t.table_name) AS "カラム数"
FROM information_schema.tables t
WHERE table_schema = 'operations'
ORDER BY table_name;

-- 5. inspectionsスキーマの詳細
SELECT 
    table_name AS "テーブル名",
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'inspections' AND table_name = t.table_name) AS "カラム数"
FROM information_schema.tables t
WHERE table_schema = 'inspections'
ORDER BY table_name;
