import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixMachinesData() {
  try {
    console.log('=== Checking machine_types and machines ===\n');

    // machine_types一覧
    const typesResult = await pool.query(`
      SELECT id, type_name, model_name
      FROM master_data.machine_types
      ORDER BY type_name
    `);
    
    console.log('Machine types:');
    typesResult.rows.forEach(row => {
      console.log(`  ${row.id}: ${row.type_name} - ${row.model_name}`);
    });

    // machines一覧
    console.log('\nMachines:');
    const machinesResult = await pool.query(`
      SELECT id, machine_number, machine_type_id, office_id
      FROM master_data.machines
    `);
    
    machinesResult.rows.forEach(row => {
      console.log(`  ${row.machine_number}: type_id=${row.machine_type_id}, office_id=${row.office_id}`);
    });

    // office一覧
    console.log('\nOffices:');
    const officesResult = await pool.query(`
      SELECT office_id, office_name
      FROM master_data.managements_offices
    `);
    
    officesResult.rows.forEach(row => {
      console.log(`  ${row.office_id}: ${row.office_name}`);
    });

    // デフォルトのoffice_idを設定（最初の事業所）
    if (officesResult.rows.length > 0) {
      const defaultOfficeId = officesResult.rows[0].office_id;
      console.log(`\n=== Updating machines with null office_id to default: ${defaultOfficeId} ===`);
      
      const updateResult = await pool.query(`
        UPDATE master_data.machines
        SET office_id = $1
        WHERE office_id IS NULL
      `, [defaultOfficeId]);
      
      console.log(`Updated ${updateResult.rowCount} machines`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

fixMachinesData();
