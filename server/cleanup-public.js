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

const tablesToDrop = [
  'machines',
  'machine_types',
  'base_documents',
  'chat_history'
];

async function cleanupPublicSchema() {
  try {
    await client.connect();
    console.log('--- CLEANING UP PUBLIC SCHEMA ---');

    for (const table of tablesToDrop) {
      // publicにテーブルが存在するか確認
      const check = await client.query(`
        SELECT count(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `, [table]);

      if (parseInt(check.rows[0].count) > 0) {
        console.log(`Dropping redundant table: public.${table}...`);
        await client.query(`DROP TABLE public.${table} CASCADE`);
        console.log(`✅ Success.`);
      } else {
        console.log(`Table public.${table} does not exist. Skipping.`);
      }
    }

    console.log('\n--- VERIFYING app_resource_routing ---');
    // ルーティングテーブル自体が自分自身（public）を指しているか確認
    const res = await client.query(`
      SELECT logical_resource_name, physical_schema || '.' || physical_table as full_path 
      FROM public.app_resource_routing 
      WHERE is_active = true
      ORDER BY logical_resource_name
    `);
    console.table(res.rows);

    await client.end();
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  }
}

cleanupPublicSchema();
