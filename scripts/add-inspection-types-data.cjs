const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'webappdb',
  user: 'postgres',
  password: 'postgres'
});

async function addInspectionTypes() {
  const client = await pool.connect();
  
  try {
    console.log('=== Adding interval_months column ===');
    await client.query(`
      ALTER TABLE master_data.inspection_types 
      ADD COLUMN IF NOT EXISTS interval_months INTEGER
    `);
    console.log('✅ Column added');

    console.log('\n=== Inserting sample data ===');
    const result = await client.query(`
      INSERT INTO master_data.inspection_types (type_name, category, interval_months, description)
      VALUES 
        ('乙A検査', '定期検査', 6, '乙A検査（6ヶ月周期）'),
        ('月検査', '定期検査', 1, '月次の定期検査'),
        ('年検査', '定期検査', 12, '年次の定期検査')
      ON CONFLICT DO NOTHING
      RETURNING *
    `);
    
    console.log(`✅ Inserted ${result.rowCount} records`);
    result.rows.forEach(row => {
      console.log(`  - ${row.type_name}: ${row.interval_months}ヶ月`);
    });

    console.log('\n=== Checking table structure ===');
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'master_data' 
        AND table_name = 'inspection_types'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n=== Current data ===');
    const data = await client.query(`
      SELECT id, type_name, category, interval_months, description 
      FROM master_data.inspection_types 
      ORDER BY interval_months
    `);
    
    console.log(`Found ${data.rowCount} records:`);
    data.rows.forEach(row => {
      console.log(`  ${row.id}. ${row.type_name} (${row.category}): ${row.interval_months}ヶ月 - ${row.description}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addInspectionTypes();
