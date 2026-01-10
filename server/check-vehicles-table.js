import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Takabeni@localhost:5432/webappdb'
});

async function checkVehiclesTable() {
  try {
    // Get column information for vehicles table
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'master_data' 
      AND table_name = 'vehicles'
      ORDER BY ordinal_position
    `;
    
    const result = await pool.query(columnsQuery);
    console.log('=== master_data.vehicles columns ===');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Get a sample row
    console.log('\n=== Sample vehicles data ===');
    const sampleQuery = `SELECT * FROM master_data.vehicles LIMIT 2`;
    const sampleResult = await pool.query(sampleQuery);
    console.log(JSON.stringify(sampleResult.rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkVehiclesTable();
