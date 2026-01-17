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

async function fixRouting() {
  try {
    await client.connect();
    console.log('Connected to database...');

    // 1. まず、タイポ版（managements_offices）を削除
    const deleteResult = await client.query(`
      DELETE FROM public.app_resource_routing 
      WHERE physical_table = 'managements_offices' 
         OR logical_resource_name = 'managements_offices'
    `);
    console.log(`✅ Deleted ${deleteResult.rowCount} typo rows`);

    // 2. 正しい版（management_offices）が master_data.management_offices を指しているか確認し、違えば更新
    const updateResult = await client.query(`
      UPDATE public.app_resource_routing 
      SET physical_schema = 'master_data',
          physical_table = 'management_offices'
      WHERE logical_resource_name = 'management_offices'
    `);
    console.log(`✅ Updated ${updateResult.rowCount} correct rows`);

    // 3. もし正しい版が一つもなければ挿入
    const checkResult = await client.query(`
      SELECT * FROM public.app_resource_routing WHERE logical_resource_name = 'management_offices'
    `);
    
    if (checkResult.rows.length === 0) {
      await client.query(`
        INSERT INTO public.app_resource_routing (app_id, logical_resource_name, physical_schema, physical_table, is_active)
        VALUES ('railway-maintenance', 'management_offices', 'master_data', 'management_offices', true)
      `);
      console.log('✅ Inserted missing routing for management_offices');
    }

    await client.end();
  } catch (err) {
    console.error('❌ Fix failed:', err.message);
    process.exit(1);
  }
}

fixRouting();
