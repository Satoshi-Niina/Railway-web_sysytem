import db from './db.js';

async function checkMachineTypesStructure() {
  try {
    console.log('\n=== machine_typesテーブル構造 ===');
    const structure = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'master_data' AND table_name = 'machine_types'
      ORDER BY ordinal_position
    `);
    console.log(JSON.stringify(structure.rows, null, 2));

    console.log('\n=== 実際のデータサンプル ===');
    const data = await db.query('SELECT * FROM master_data.machine_types LIMIT 3');
    console.log(JSON.stringify(data.rows, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMachineTypesStructure();
