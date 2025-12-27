import pool from './db.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function insertInspectionTypes() {
  try {
    console.log('検修タイプマスタにサンプルデータを挿入中...');
    
    const sqlPath = resolve(__dirname, '../scripts/insert-inspection-types.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ 検修タイプマスタの挿入が完了しました');
    
    // 挿入されたデータを確認
    const result = await pool.query('SELECT * FROM master_data.inspection_types ORDER BY category, type_name');
    console.log('\n挿入されたデータ:');
    console.table(result.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

insertInspectionTypes();
