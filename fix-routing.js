import pool from './server/db.js';

async function checkAndAddRouting() {
  try {
    // Check existing structure
    console.log('=== Existing app_resource_routing structure ===\n');
    const sample = await pool.query(`
      SELECT * FROM public.app_resource_routing LIMIT 1
    `);
    
    if (sample.rows.length > 0) {
      console.log('Sample entry:');
      console.log(JSON.stringify(sample.rows[0], null, 2));
    }
    
    // Check if machine-types entry exists
    console.log('\n=== Checking for machine-types entry ===');
    const machineTypesCheck = await pool.query(`
      SELECT * FROM public.app_resource_routing
      WHERE logical_resource_name = 'machine-types'
    `);
    
    if (machineTypesCheck.rows.length === 0) {
      console.log('machine-types entry not found. Need to add it.');
      
      // Get a sample app_id to use
      const appIdSample = await pool.query(`
        SELECT DISTINCT app_id FROM public.app_resource_routing LIMIT 1
      `);
      
      const appId = appIdSample.rows[0]?.app_id || 'railway-maintenance';
      console.log(`Using app_id: ${appId}`);
      
      // Get next routing_id
      const maxId = await pool.query(`
        SELECT MAX(routing_id) as max_id FROM public.app_resource_routing
      `);
      
      const nextId = (maxId.rows[0]?.max_id || 0) + 1;
      console.log(`Using routing_id: ${nextId}`);
      
      // Insert
      await pool.query(`
        INSERT INTO public.app_resource_routing (
          routing_id,
          app_id,
          logical_resource_name, 
          physical_schema, 
          physical_table,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [nextId, appId, 'machine-types', 'master_data', 'machine_types', true]);
      
      console.log('✅ Added machine-types routing');
    } else {
      console.log('✅ machine-types routing already exists');
      console.log(JSON.stringify(machineTypesCheck.rows[0], null, 2));
    }
    
    // Verify final state
    console.log('\n=== Final verification ===');
    const final = await pool.query(`
      SELECT logical_resource_name, physical_schema, physical_table, is_active
      FROM public.app_resource_routing
      WHERE logical_resource_name IN ('machine-types', 'machines')
      ORDER BY logical_resource_name
    `);
    
    final.rows.forEach(row => {
      console.log(`${row.logical_resource_name} -> ${row.physical_schema}.${row.physical_table} (active: ${row.is_active})`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkAndAddRouting();
