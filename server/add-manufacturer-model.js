import db from './db.js';

async function addManufacturerModelColumn() {
  try {
    console.log('\n=== manufacturer_modelカラムを追加 ===');
    
    // カラムを追加
    await db.query(`
      ALTER TABLE master_data.machine_types 
      ADD COLUMN IF NOT EXISTS manufacturer_model VARCHAR(100)
    `);
    
    console.log('✓ manufacturer_modelカラムを追加しました');
    
    // 更新後の構造を確認
    const structure = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'master_data' AND table_name = 'machine_types'
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== 更新後のテーブル構造 ===');
    console.log(structure.rows.map(r => `${r.column_name}: ${r.data_type}`).join('\n'));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addManufacturerModelColumn();
