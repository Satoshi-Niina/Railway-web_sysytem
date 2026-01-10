import pool from './server/db.js';

async function checkResourceRouting() {
  try {
    console.log('=== Checking app_resource_routing ===');
    
    const result = await pool.query(`
      SELECT 
        routing_id,
        logical_resource_name,
        physical_schema,
        physical_table
      FROM public.app_resource_routing
      ORDER BY logical_resource_name
    `);
    
    console.log('\n=== Resource Routing Configuration ===');
    console.log(JSON.stringify(result.rows, null, 2));
    
    // machine_typesテーブルの実際の構造を確認
    console.log('\n=== Machine Types Table Structure ===');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'master_data' AND table_name = 'machine_types'
      ORDER BY ordinal_position
    `);
    
    console.table(schemaResult.rows);
    
    // 実際のデータを確認
    console.log('\n=== Sample Data from master_data.machine_types ===');
    const dataResult = await pool.query(`
      SELECT * FROM master_data.machine_types LIMIT 3
    `);
    
    console.table(dataResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkResourceRouting();
