// データベース接続とスキーマ確認スクリプト
import pg from 'pg';

const { Pool } = pg;

import dotenv from 'dotenv';
dotenv.config();

// データベース接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/webappdb',
  ssl: false,
});

async function checkDatabaseStatus() {
  const client = await pool.connect();
  
  try {
    console.log('=== データベース接続情報 ===');
    const dbInfo = await client.query('SELECT current_database(), current_user;');
    console.log('データベース:', dbInfo.rows[0].current_database);
    console.log('ユーザー:', dbInfo.rows[0].current_user);
    
    console.log('\n=== 存在するデータベース一覧 ===');
    const databases = await client.query(`
      SELECT datname FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname;
    `);
    databases.rows.forEach(row => {
      console.log(`  - ${row.datname}`);
    });
    
    console.log('\n=== 存在するスキーマ一覧 ===');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      ORDER BY schema_name;
    `);
    schemas.rows.forEach(row => {
      console.log(`  - ${row.schema_name}`);
    });
    
    console.log('\n=== 各スキーマのテーブル数 ===');
    const tableCounts = await client.query(`
      SELECT table_schema, COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      GROUP BY table_schema
      ORDER BY table_schema;
    `);
    tableCounts.rows.forEach(row => {
      console.log(`  ${row.table_schema}: ${row.table_count}テーブル`);
    });
    
    console.log('\n=== master_data スキーマのテーブル ===');
    const masterDataTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'master_data'
      ORDER BY table_name;
    `);
    if (masterDataTables.rows.length > 0) {
      masterDataTables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  テーブルが見つかりません');
    }
    
    console.log('\n=== operations スキーマのテーブル ===');
    const operationsTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'operations'
      ORDER BY table_name;
    `);
    if (operationsTables.rows.length > 0) {
      operationsTables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  テーブルが見つかりません');
    }
    
    console.log('\n=== inspections スキーマのテーブル ===');
    const inspectionsTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'inspections'
      ORDER BY table_name;
    `);
    if (inspectionsTables.rows.length > 0) {
      inspectionsTables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  テーブルが見つかりません');
    }
    
    console.log('\n=== maintenance スキーマのテーブル ===');
    const maintenanceTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'maintenance'
      ORDER BY table_name;
    `);
    if (maintenanceTables.rows.length > 0) {
      maintenanceTables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  テーブルが見つかりません');
    }
    
    console.log('\n=== DBeaver接続情報 ===');
    console.log('環境変数DATABASE_URLを使用してください');
    console.log('\nDBeaverでこの接続情報を確認してください。');
    console.log('スキーマが表示されない場合は、DBeaver上で右クリック > Refresh を実行してください。');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabaseStatus().catch(console.error);
