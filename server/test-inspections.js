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
    
    // Check if vehicle_inspection_schedules table exists
    const res1 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'master_data' AND table_name = 'vehicle_inspection_schedules'
    `);
    console.log('vehicle_inspection_schedules columns:', res1.rows);
    
    // Check inspection_schedules table
    const res2 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'master_data' AND table_name = 'inspection_schedules'
    `);
    console.log('inspection_schedules columns:', res2.rows);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

test();
