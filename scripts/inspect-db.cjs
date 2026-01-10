const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Takabeni@localhost:5432/webappdb',
});

async function check() {
  try {
    console.log('--- TABLES ---');
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('public', 'master_data', 'operations', 'inspections')
      ORDER BY table_schema, table_name
    `);
    res.rows.forEach(r => console.log(`- ${r.table_schema}.${r.table_name}`));

    console.log('\n--- VEHICLES COLUMNS ---');
    const v = await pool.query(`
      SELECT table_schema, column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles'
      ORDER BY table_schema, ordinal_position
    `);
    v.rows.forEach(r => console.log(`  [${r.table_schema}] ${r.column_name}`));

    console.log('\n--- ROUTING ---');
    try {
      const r2 = await pool.query("SELECT * FROM public.app_resource_routing WHERE is_active = true");
      r2.rows.forEach(r => console.log(`  ${r.logical_resource_name} -> ${r.physical_schema}.${r.physical_table}`));
    } catch (e) {
      console.log('  No routing table found:', e.message);
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await pool.end();
  }
}

check();
