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
    
    // Check vehicles table for vehicle_id = 1 (machine_number = 300)
    const res1 = await client.query(`
      SELECT vehicle_id, registration_number, machine_id
      FROM master_data.vehicles
      WHERE registration_number = '300'
    `);
    console.log('Vehicle with registration_number 300:', res1.rows);
    
    // Check if there are plans for vehicle_id = 1 or for vehicle 300
    const res2 = await client.query(`
      SELECT DISTINCT vehicle_id 
      FROM operations.operation_plans 
      WHERE TO_CHAR(plan_date, 'YYYY-MM') = '2026-02'
    `);
    console.log('\nUnique vehicle_ids in operation_plans (2026-02):', res2.rows);
    
    // Check machines table for machine_number 300
    const res3 = await client.query(`
      SELECT id, machine_number, machine_type_id
      FROM master_data.machines
      WHERE machine_number LIKE '%300%'
    `);
    console.log('\nMachines with 300 in number:', res3.rows);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

test();
