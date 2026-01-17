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

async function inspect() {
  try {
    await client.connect();
    console.log('--- DATABASE INSPECTION ---');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
    
    // 全テーブルリストの取得
    const tables = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog') 
      ORDER BY table_schema, table_name
    `);
    
    console.log('Total Tables found:', tables.rows.length);
    tables.rows.forEach(r => console.log(`${r.table_schema}.${r.table_name}`));

    // 特定の足りないテーブルの確認
    const missing = await client.query(`
      SELECT table_schema, table_name FROM information_schema.tables 
      WHERE table_name = 'management_offices'
    `);
    if (missing.rows.length > 0) {
      console.log('\nmanagement_offices exists in:');
      missing.rows.forEach(r => console.log(` - ${r.table_schema}`));
    } else {
      console.log('\nmanagement_offices NOT FOUND anywhere.');
    }

    await client.end();
  } catch (err) {
    console.error('Inspection failed:', err.message);
    process.exit(1);
  }
}

inspect();
