import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Takabeni@localhost:5432/webappdb'
});

async function checkSchema() {
  try {
    // Check inspections schema tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'inspections' 
      ORDER BY table_name
    `);
    
    console.log('=== Inspections Schema Tables ===');
    console.log(tables.rows.map(t => t.table_name));
    
    // Check if inspection_cycle_order exists
    const cycleOrderExists = tables.rows.some(t => t.table_name === 'inspection_cycle_order');
    console.log('\ninspection_cycle_order exists:', cycleOrderExists);
    
    if (cycleOrderExists) {
      // Check data in inspection_cycle_order
      const cycleData = await pool.query(`
        SELECT * FROM inspections.inspection_cycle_order 
        ORDER BY vehicle_type, cycle_order 
        LIMIT 10
      `);
      console.log('\n=== Sample inspection_cycle_order data ===');
      console.log(cycleData.rows);
    }
    
    // Check vehicle_inspection_records
    const recordsExists = tables.rows.some(t => t.table_name === 'vehicle_inspection_records');
    console.log('\nvehicle_inspection_records exists:', recordsExists);
    
    if (recordsExists) {
      const recordsCount = await pool.query(`
        SELECT COUNT(*) FROM inspections.vehicle_inspection_records
      `);
      console.log('vehicle_inspection_records count:', recordsCount.rows[0].count);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
