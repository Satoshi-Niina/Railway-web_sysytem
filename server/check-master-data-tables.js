import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkMasterDataTables() {
  try {
    console.log('=== Checking master_data schema tables ===\n');

    // master_data スキーマのテーブル一覧
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'master_data'
      ORDER BY table_name
    `);

    console.log('Tables in master_data schema:');
    for (const row of tablesResult.rows) {
      console.log(`\n📋 ${row.table_name}`);
      
      // 各テーブルの列情報を取得
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'master_data' AND table_name = $1
        ORDER BY ordinal_position
        LIMIT 10
      `, [row.table_name]);
      
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
      // レコード数を確認
      const countResult = await pool.query(`
        SELECT COUNT(*) as count FROM master_data.${row.table_name}
      `);
      console.log(`  Total: ${countResult.rows[0].count} records`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

checkMasterDataTables();
