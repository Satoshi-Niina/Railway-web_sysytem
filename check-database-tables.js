import pool from './server/db.js';

async function checkDatabaseTables() {
  try {
    console.log('\n=== Checking Database Tables and Data ===\n');
    
    // 1. Check if machine_types or machine-types table exists
    console.log('1. Checking which machine types table exists...');
    const tableCheck = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'master_data' 
      AND (table_name = 'machine_types' OR table_name = 'machine-types')
    `);
    
    console.log('Found tables:');
    console.table(tableCheck.rows);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ No machine types table found!');
      await pool.end();
      return;
    }
    
    const actualTableName = tableCheck.rows[0].table_name;
    console.log(`\n✅ Using table: master_data.${actualTableName}\n`);
    
    // 2. Check table structure
    console.log('2. Table structure:');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'master_data' AND table_name = $1
      ORDER BY ordinal_position
    `, [actualTableName]);
    
    console.table(structureResult.rows);
    
    // 3. Check sample data
    console.log(`\n3. Sample data from master_data.${actualTableName}:`);
    const dataResult = await pool.query(`
      SELECT * FROM master_data."${actualTableName}" LIMIT 5
    `);
    
    console.log(`Found ${dataResult.rows.length} rows\n`);
    console.table(dataResult.rows);
    
    // 4. Check app_resource_routing for machine-types
    console.log('\n4. app_resource_routing configuration for machine-types:');
    const routingResult = await pool.query(`
      SELECT logical_resource_name, physical_schema, physical_table, is_active
      FROM public.app_resource_routing
      WHERE logical_resource_name IN ('machine-types', 'machines')
      ORDER BY logical_resource_name
    `);
    
    console.table(routingResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkDatabaseTables();
