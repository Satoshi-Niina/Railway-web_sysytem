import pool from './server/db.js';

async function simpleCheck() {
  try {
    // Check which table exists
    const result1 = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'master_data' 
      AND table_name LIKE 'machine%type%'
    `);
    
    console.log('=== Machine Types Tables ===');
    result1.rows.forEach(row => console.log('- ' + row.table_name));
    
    // Check routing
    const result2 = await pool.query(`
      SELECT logical_resource_name, physical_table 
      FROM public.app_resource_routing
      WHERE logical_resource_name = 'machine-types'
    `);
    
    console.log('\n=== Routing for machine-types ===');
    if (result2.rows.length > 0) {
      console.log('Logical: machine-types');
      console.log('Physical: ' + result2.rows[0].physical_table);
      console.log('Schema: ' + result2.rows[0].physical_schema || 'master_data');
    } else {
      console.log('No routing found!');
    }
    
    // Try to query data
    console.log('\n=== Trying to query machine_types ===');
    try {
      const result3 = await pool.query('SELECT id, type_name, model_name FROM master_data.machine_types LIMIT 3');
      console.log('SUCCESS! Found ' + result3.rows.length + ' rows');
      result3.rows.forEach((row, i) => {
        console.log(`Row ${i+1}: id=${row.id}, type_name=${row.type_name}, model_name=${row.model_name}`);
      });
    } catch (e) {
      console.log('FAILED: ' + e.message);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

simpleCheck();
