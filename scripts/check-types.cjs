const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Takabeni@localhost:5432/webappdb' });

async function checkTypes() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'master_data' 
      AND table_name IN ('vehicles', 'machines', 'machine_types', 'management_offices', 'bases')
      ORDER BY table_name, ordinal_position
    `);
    
    console.log('--- COLUMN TYPES ---');
    res.rows.forEach(r => {
      console.log(`${r.table_name}.${r.column_name}: ${r.data_type}`);
    });
  } catch (e) {
    console.error(e.message);
  } finally {
    await pool.end();
  }
}

checkTypes();
