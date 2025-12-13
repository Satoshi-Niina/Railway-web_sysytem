// スキーマ構造を作成するスクリプト
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// データベース接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/webappdb',
  ssl: false,
});

async function executeSchemaSetup() {
  const client = await pool.connect();
  
  try {
    console.log('データベースに接続しました');
    
    // SQLファイルを読み込む
    const sqlPath = path.join(__dirname, '29-create-schema-structure.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('スキーマ構造を作成中...');
    
    // SQLを実行
    await client.query(sql);
    
    console.log('✅ スキーマ構造の作成が完了しました');
    
    // 作成されたスキーマを確認
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('master_data', 'operations', 'inspections', 'maintenance')
      ORDER BY schema_name;
    `);
    
    console.log('\n作成されたスキーマ:');
    schemasResult.rows.forEach(row => {
      console.log(`  - ${row.schema_name}`);
    });
    
    // 各スキーマのテーブルを確認
    const tablesResult = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('master_data', 'operations', 'inspections', 'maintenance')
      ORDER BY table_schema, table_name;
    `);
    
    console.log('\n作成されたテーブル:');
    let currentSchema = '';
    tablesResult.rows.forEach(row => {
      if (row.table_schema !== currentSchema) {
        currentSchema = row.table_schema;
        console.log(`\n${currentSchema}:`);
      }
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

executeSchemaSetup().catch(console.error);
