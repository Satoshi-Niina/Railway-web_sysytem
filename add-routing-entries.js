import pool from './server/db.js';

async function addResourceRouting() {
  try {
    console.log('=== Adding Resource Routing Entries ===\n');
    
    // Check if entries already exist
    const existing = await pool.query(`
      SELECT logical_resource_name FROM public.app_resource_routing
      WHERE logical_resource_name IN ('machine-types', 'machines')
    `);
    
    console.log('Existing entries:', existing.rows.map(r => r.logical_resource_name));
    
    // Add machine-types entry if not exists
    if (!existing.rows.find(r => r.logical_resource_name === 'machine-types')) {
      console.log('\nAdding machine-types routing...');
      await pool.query(`
        INSERT INTO public.app_resource_routing (
          logical_resource_name, 
          physical_schema, 
          physical_table,
          is_active
        ) VALUES (
          'machine-types',
          'master_data',
          'machine_types',
          true
        )
      `);
      console.log('✅ Added machine-types routing');
    } else {
      console.log('\n⚠️ machine-types routing already exists');
    }
    
    // Add machines entry if not exists
    if (!existing.rows.find(r => r.logical_resource_name === 'machines')) {
      console.log('\nAdding machines routing...');
      await pool.query(`
        INSERT INTO public.app_resource_routing (
          logical_resource_name, 
          physical_schema, 
          physical_table,
          is_active
        ) VALUES (
          'machines',
          'master_data',
          'machines',
          true
        )
      `);
      console.log('✅ Added machines routing');
    } else {
      console.log('\n⚠️ machines routing already exists');
    }
    
    // Verify
    console.log('\n=== Verification ===');
    const verify = await pool.query(`
      SELECT logical_resource_name, physical_schema, physical_table, is_active
      FROM public.app_resource_routing
      WHERE logical_resource_name IN ('machine-types', 'machines')
      ORDER BY logical_resource_name
    `);
    
    console.log('Current routing configuration:');
    verify.rows.forEach(row => {
      console.log(`  ${row.logical_resource_name} -> ${row.physical_schema}.${row.physical_table} (active: ${row.is_active})`);
    });
    
    await pool.end();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addResourceRouting();
