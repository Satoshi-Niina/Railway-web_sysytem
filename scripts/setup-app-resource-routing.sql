-- ====================================
-- app_resource_routing設定スクリプト
-- railway-maintenance-systemのルーティング設定
-- ====================================

-- 既存の重複を削除
DELETE FROM public.app_resource_routing 
WHERE app_id = 'railway-maintenance';

-- railway-maintenance-system用のルーティング設定を追加
INSERT INTO public.app_resource_routing 
  (app_id, logical_resource_name, physical_schema, physical_table, is_active, created_at, updated_at)
VALUES
  -- master_dataスキーマ
  ('railway-maintenance', 'managements_offices', 'master_data', 'managements_offices', true, NOW(), NOW()),
  ('railway-maintenance', 'management_offices', 'master_data', 'managements_offices', true, NOW(), NOW()),
  ('railway-maintenance', 'bases', 'master_data', 'bases', true, NOW(), NOW()),
  ('railway-maintenance', 'machines', 'master_data', 'machines', true, NOW(), NOW()),
  ('railway-maintenance', 'machine_types', 'master_data', 'machine_types', true, NOW(), NOW()),
  ('railway-maintenance', 'vehicles', 'master_data', 'vehicles', true, NOW(), NOW()),
  ('railway-maintenance', 'vehicle_types', 'master_data', 'vehicle_types', true, NOW(), NOW()),
  ('railway-maintenance', 'inspection_types', 'master_data', 'inspection_types', true, NOW(), NOW()),
  ('railway-maintenance', 'maintenance_base_dates', 'master_data', 'maintenance_base_dates', true, NOW(), NOW()),
  ('railway-maintenance', 'users', 'master_data', 'users', true, NOW(), NOW()),
  
  -- operationsスキーマ
  ('railway-maintenance', 'schedules', 'operations', 'schedules', true, NOW(), NOW()),
  ('railway-maintenance', 'operation_plans', 'operations', 'schedules', true, NOW(), NOW()),
  ('railway-maintenance', 'operation_records', 'operations', 'operation_records', true, NOW(), NOW()),
  ('railway-maintenance', 'travel_plans', 'operations', 'travel_plans', true, NOW(), NOW()),
  ('railway-maintenance', 'travel_records', 'operations', 'travel_records', true, NOW(), NOW()),
  
  -- inspectionsスキーマ
  ('railway-maintenance', 'inspections', 'inspections', 'inspections', true, NOW(), NOW()),
  ('railway-maintenance', 'inspection_plans', 'inspections', 'inspection_plans', true, NOW(), NOW()),
  ('railway-maintenance', 'maintenance_cycles', 'inspections', 'maintenance_cycles', true, NOW(), NOW()),
  ('railway-maintenance', 'vehicle_inspection_records', 'inspections', 'vehicle_inspection_records', true, NOW(), NOW()),
  ('railway-maintenance', 'vehicle_inspection_schedule', 'inspections', 'vehicle_inspection_schedule', true, NOW(), NOW()),
  ('railway-maintenance', 'vehicle_inspection_schedules', 'inspections', 'vehicle_inspection_schedules', true, NOW(), NOW()),
  
  -- maintenanceスキーマ
  ('railway-maintenance', 'failures', 'maintenance', 'failures', true, NOW(), NOW()),
  ('railway-maintenance', 'repairs', 'maintenance', 'repairs', true, NOW(), NOW()),
  ('railway-maintenance', 'monthly_maintenance_plans', 'maintenance', 'monthly_maintenance_plans', true, NOW(), NOW()),
  ('railway-maintenance', 'maintenance_schedules', 'maintenance', 'maintenance_schedules', true, NOW(), NOW())
ON CONFLICT (app_id, logical_resource_name) 
DO UPDATE SET 
  physical_schema = EXCLUDED.physical_schema,
  physical_table = EXCLUDED.physical_table,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 確認用クエリ
SELECT 
  app_id, 
  logical_resource_name, 
  physical_schema || '.' || physical_table as full_path,
  is_active,
  updated_at
FROM public.app_resource_routing 
WHERE app_id = 'railway-maintenance'
ORDER BY physical_schema, logical_resource_name;

-- サマリー表示
SELECT 
  physical_schema,
  COUNT(*) as table_count
FROM public.app_resource_routing 
WHERE app_id = 'railway-maintenance' AND is_active = true
GROUP BY physical_schema
ORDER BY physical_schema;
