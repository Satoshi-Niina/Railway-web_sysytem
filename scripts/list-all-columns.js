import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: 'postgresql://postgres:Takabeni@localhost:5432/webappdb' });

async function listColumns() {
  try {
    const res = await pool.query(`
      SELECT table_schema, table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema IN ('master_data', 'operations', 'inspections', 'maintenance')
      ORDER BY table_schema, table_name, ordinal_position
    `);
    
    console.log('--- ALL COLUMNS ---');
    let currentTable = '';
    res.rows.forEach(r => {
      const fullTableName = `${r.table_schema}.${r.table_name}`;
      if (fullTableName !== currentTable) {
        console.log(`\nTable: ${fullTableName}`);
        currentTable = fullTableName;
      }
      console.log(`  - ${r.column_name}`);
    });
  } catch (e) {
    console.error(e.message);
  } finally {
    await pool.end();
  }
}

listColumns();
