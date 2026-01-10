import pool from './server/db.js';

async function checkMachineData() {
  try {
    console.log('\n=== Checking Machines Data ===\n');
    
    // 全車両のmachine_type_idとmodel_nameを確認
    const machines = await pool.query(`
      SELECT 
        m.id,
        m.machine_number,
        m.machine_type_id,
        mt.type_name,
        mt.model_name
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id::text = mt.id::text
      ORDER BY m.machine_number
    `);
    
    console.log('=== All Machines ===');
    machines.rows.forEach(row => {
      console.log(`Machine ${row.machine_number}: type_id=${row.machine_type_id}, type_name=${row.type_name}, model_name=${row.model_name}`);
    });
    
    // 重複しているmachine_type_idを確認
    const typeCounts = await pool.query(`
      SELECT 
        machine_type_id,
        COUNT(*) as count,
        STRING_AGG(machine_number, ', ') as machines
      FROM master_data.machines
      GROUP BY machine_type_id
      ORDER BY count DESC
    `);
    
    console.log('\n=== Machine Type Usage ===');
    typeCounts.rows.forEach(row => {
      console.log(`Type ID ${row.machine_type_id}: ${row.count} machines (${row.machines})`);
    });
    
    // 全てのmachine_typesを確認
    const allTypes = await pool.query(`
      SELECT id, type_name, model_name, type_code
      FROM master_data.machine_types
      ORDER BY type_name, model_name
    `);
    
    console.log('\n=== All Machine Types ===');
    allTypes.rows.forEach(row => {
      console.log(`${row.id}: ${row.type_name} - ${row.model_name} (${row.type_code})`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkMachineData();
