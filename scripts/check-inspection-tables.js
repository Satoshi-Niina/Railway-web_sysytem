import pool from '../server/db.js';

async function checkTables() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('master_data', 'operations', 'inspections', 'maintenance')
      ORDER BY table_schema, table_name
    `);
    
    console.log('=== 既存テーブル ===\n');
    result.rows.forEach(row => {
      console.log(`${row.table_schema}.${row.table_name}`);
    });
    
    // inspection_typesの内容を確認
    console.log('\n=== inspection_types テーブルの内容 ===\n');
    const types = await client.query('SELECT * FROM master_data.inspection_types LIMIT 5');
    console.log(types.rows);
    
  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
