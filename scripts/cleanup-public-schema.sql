-- ===================================================================
-- CloudDB publicスキーマ整理スクリプト
-- ===================================================================
-- 目的: 業務テーブルをpublicから適切なスキーマへ移動
-- 実行日: 2026年1月9日
-- 
-- 注意事項:
-- 1. 実行前に必ずバックアップを取得してください
-- 2. 外部キー制約がある場合は、依存関係を確認してください
-- 3. アプリケーションを停止してから実行してください
-- ===================================================================

BEGIN;

-- ===================================================================
-- 1. operations スキーマへの移動
-- ===================================================================

-- サポートフロー管理
ALTER TABLE public.support_flows SET SCHEMA operations;
ALTER TABLE public.support_history SET SCHEMA operations;

-- ===================================================================
-- 2. emergency スキーマへの移動
-- ===================================================================

-- 緊急対応フロー
ALTER TABLE public.emergency_flows SET SCHEMA emergency;

-- コミュニケーション関連
ALTER TABLE public.messages SET SCHEMA emergency;
ALTER TABLE public.media SET SCHEMA emergency;
ALTER TABLE public.images SET SCHEMA emergency;
ALTER TABLE public.image_data SET SCHEMA emergency;

-- チャット履歴バックアップ
ALTER TABLE public.chat_exports SET SCHEMA emergency;
ALTER TABLE public.chat_history_backup SET SCHEMA emergency;

-- ===================================================================
-- 3. maintenance スキーマへの移動
-- ===================================================================

-- 故障履歴
ALTER TABLE public.fault_history SET SCHEMA maintenance;

-- ===================================================================
-- 4. 確認が必要なテーブル
-- ===================================================================

-- 以下のテーブルは用途を確認してから処理してください:
-- 
-- public.chat_history → master_data.chat_history と重複の可能性
-- public.documents → 用途不明、適切なスキーマへ移動またはmaster_dataへ
-- public.history_images → 用途確認が必要

-- ===================================================================
-- 5. publicスキーマの想定テーブル（残すべきもの）
-- ===================================================================

-- 以下のテーブルはpublicスキーマに残します:
-- - access_token_policy (認証基盤)
-- - app_resource_routing (ルーティング管理)
-- - gateway_access_logs (アクセスログ)
-- - schema_migrations (マイグレーション管理)

COMMIT;

-- ===================================================================
-- 実行後の確認クエリ
-- ===================================================================

-- publicスキーマに残っているテーブルを確認
SELECT table_name, 
       pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 各スキーマのテーブル数を確認
SELECT 
  table_schema,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema IN ('public', 'master_data', 'operations', 'inspections', 'emergency', 'maintenance')
AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;
