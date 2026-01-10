import db from './db.js';

async function showAllMachines() {
  try {
    console.log('\n=== 全machinesデータ ===');
    const machines = await db.query('SELECT * FROM master_data.machines ORDER BY machine_number');
    console.log(JSON.stringify(machines.rows, null, 2));

    console.log('\n=== 全machine_types ===');
    const types = await db.query('SELECT id, type_code, type_name, model_name FROM master_data.machine_types ORDER BY model_name');
    console.log(JSON.stringify(types.rows, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

showAllMachines();
