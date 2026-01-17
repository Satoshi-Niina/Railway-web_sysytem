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
    
    // Check operation_records data
    const res1 = await client.query(`
      SELECT vehicle_id, operation_date, status
      FROM operations.operation_records
      ORDER BY operation_date DESC
      LIMIT 5
    `);
    console.log('Recent operation_records:', res1.rows);
    
    // Check column type
    const res2 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'operations' AND table_name = 'operation_records'
      AND column_name = 'vehicle_id'
    `);
    console.log('\noperation_records.vehicle_id type:', res2.rows);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

test();
