import db from './db.js';

async function debugTables() {
  try {
    console.log('\n=== master_data.machine_types テーブル ===');
    const types = await db.query('SELECT id, type_code, type_name, model_name, category FROM master_data.machine_types LIMIT 5');
    console.log(JSON.stringify(types.rows, null, 2));

    console.log('\n=== master_data.machines テーブル ===');
    const machines = await db.query('SELECT id, machine_number, machine_type_id FROM master_data.machines LIMIT 5');
    console.log(JSON.stringify(machines.rows, null, 2));

    console.log('\n=== JOIN結果 ===');
    const joined = await db.query(`
      SELECT 
        m.id,
        m.machine_number,
        m.machine_type_id,
        mt.id as mt_id,
        mt.model_name,
        mt.category
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LIMIT 5
    `);
    console.log(JSON.stringify(joined.rows, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugTables();
