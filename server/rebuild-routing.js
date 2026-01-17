import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.development') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

const correctRouting = [
  // 論理名, スキーマ, 物理テーブル
  ['management_offices', 'master_data', 'management_offices'],
  ['offices', 'master_data', 'management_offices'],
  ['bases', 'master_data', 'bases'],
  ['vehicles', 'master_data', 'vehicles'],
  ['machines', 'master_data', 'machines'],
  ['machine_types', 'master_data', 'machine_types'],
  ['inspection_types', 'master_data', 'inspection_types'],
  ['inspection_schedules', 'master_data', 'inspection_schedules'],
  ['maintenance_base_dates', 'master_data', 'maintenance_base_dates'],
  ['users', 'master_data', 'users'],
  // 運用・検査データ
  ['operation_plans', 'operations', 'operation_plans'],
  ['schedules', 'operations', 'operation_plans'], // 別名対応
  ['operation_records', 'operations', 'operation_records'],
  ['inspections', 'inspections', 'inspections'],
  ['inspection_plans', 'inspections', 'inspection_plans'],
  ['failures', 'maintenance', 'failures'],
  ['repairs', 'maintenance', 'repairs']
];

async function rebuildRouting() {
  try {
    await client.connect();
    console.log('--- REBUILDING ROUTING TABLE ---');

    // トランザクション開始
    await client.query('BEGIN');

    // 既存の怪しいデータを削除（小文字に統一するため、大文字の論理名も削除対象）
    await client.query("DELETE FROM public.app_resource_routing WHERE app_id = 'railway-maintenance' OR app_id IS NULL");

    for (const [logical, schema, table] of correctRouting) {
      await client.query(`
        INSERT INTO public.app_resource_routing 
          (app_id, logical_resource_name, physical_schema, physical_table, is_active)
        VALUES 
          ('railway-maintenance', $1, $2, $3, true)
        ON CONFLICT (app_id, logical_resource_name) 
        DO UPDATE SET physical_schema = $2, physical_table = $3
      `, [logical, schema, table]);
      console.log(`Mapped: ${logical} -> ${schema}.${table}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ ROUTING TABLE REBUILT SUCCESSFULLY');
    await client.end();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Rebuild failed:', err.message);
    process.exit(1);
  }
}

rebuildRouting();
