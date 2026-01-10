import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.development') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function inspect() {
  try {
    console.log('--- 接続テスト ---');
    console.log('URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
    const now = await pool.query('SELECT NOW()');
    console.log('Success:', now.rows[0]);

    console.log('\n--- スキーマ・テーブル一覧 ---');
    const tables = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);
    tables.rows.forEach(t => console.log(`- ${t.table_schema}.${t.table_name}`));

    console.log('\n--- vehicles テーブルのカラム詳細 ---');
    const columns = await pool.query(`
      SELECT table_schema, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles'
      ORDER BY table_schema, ordinal_position
    `);
    columns.rows.forEach(c => console.log(`  [${c.table_schema}] ${c.column_name} (${c.data_type})`));

    console.log('\n--- ルーティングテーブル内容 ---');
    try {
      const routing = await pool.query('SELECT * FROM public.app_resource_routing WHERE is_active = true');
      routing.rows.forEach(r => console.log(`  ${r.logical_resource_name} -> ${r.physical_schema}.${r.physical_table}`));
    } catch (e) {
      console.log('  routing table (app_resource_routing) not found or error:', e.message);
    }

  } catch (err) {
    console.error('FAILED:', err);
  } finally {
    await pool.end();
  }
}

inspect();
