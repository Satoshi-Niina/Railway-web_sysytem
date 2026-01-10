import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Takabeni@localhost:5432/webappdb'
});

async function checkMachinesAndTypes() {
  try {
    // Get machine_types columns
    console.log('=== master_data.machine_types columns ===');
    const typesColumnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'master_data' 
      AND table_name = 'machine_types'
      ORDER BY ordinal_position
    `;
    const typesColsResult = await pool.query(typesColumnsQuery);
    typesColsResult.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    // Get machines columns
    console.log('\n=== master_data.machines columns ===');
    const machinesColumnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'master_data' 
      AND table_name = 'machines'
      ORDER BY ordinal_position
    `;
    const machinesColsResult = await pool.query(machinesColumnsQuery);
    machinesColsResult.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    // Sample data from machines
    console.log('\n=== Sample machines data (first 3) ===');
    const machinesQuery = `
      SELECT m.*, mt.type_name, mt.model_name
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LIMIT 3
    `;
    const machinesResult = await pool.query(machinesQuery);
    console.log(JSON.stringify(machinesResult.rows, null, 2));
    
    // Count machines
    console.log('\n=== Machines count ===');
    const countQuery = `SELECT COUNT(*) FROM master_data.machines`;
    const countResult = await pool.query(countQuery);
    console.log(`Total machines: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkMachinesAndTypes();
