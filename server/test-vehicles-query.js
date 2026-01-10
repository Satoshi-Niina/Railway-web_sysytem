import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testVehiclesQuery() {
  try {
    console.log('=== Testing vehicles query ===\n');

    // machinesテーブルのサンプルデータ
    const machinesResult = await pool.query(`
      SELECT id, machine_number, machine_type_id, office_id
      FROM master_data.machines
      LIMIT 5
    `);
    
    console.log('Sample machines data:');
    machinesResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Number: ${row.machine_number}, Type: ${row.machine_type_id}, Office: ${row.office_id}`);
    });

    // 実際のAPIクエリをテスト
    console.log('\n=== Testing API query ===');
    const vehicles = await pool.query(`
      SELECT 
        m.id as id,
        m.machine_number,
        mt.type_name as vehicle_type,
        mt.model_name as model,
        'active' as status,
        mo.office_name,
        mo.office_id as management_office_id,
        m.purchase_date as acquisition_date,
        m.created_at,
        m.updated_at
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id::text = mt.id::text
      LEFT JOIN master_data.managements_offices mo ON m.office_id::text = mo.office_id::text
      ORDER BY mt.type_name, m.machine_number
    `);

    console.log(`\nFound ${vehicles.rows.length} vehicles`);
    vehicles.rows.forEach(row => {
      console.log(`  ${row.vehicle_type} ${row.machine_number} - Office: ${row.office_name}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

testVehiclesQuery();
