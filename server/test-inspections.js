import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.development') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function test() {
  try {
    await client.connect();
    
    // Check if vehicles have data
    const res1 = await client.query(`
      SELECT 
        v.vehicle_id as id,
        v.vehicle_id,
        v.registration_number as machine_number,
        v.registration_number as vehicle_number,
        v.status,
        v.office_id as management_office_id,
        mo.office_name,
        mt.type_code as vehicle_type,
        mt.model_name as model_name
      FROM master_data.vehicles v
      LEFT JOIN master_data.machines m ON v.machine_id = m.id
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LEFT JOIN master_data.management_offices mo ON v.office_id = mo.office_id
      LIMIT 5
    `);
    console.log('Vehicles data:', JSON.stringify(res1.rows, null, 2));
    console.log('Total vehicles:', res1.rows.length);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

test();
