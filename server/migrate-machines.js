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

async function migrateData() {
  try {
    await client.connect();
    console.log('--- MIGRATING MACHINE DATA TO VEHICLES ---');

    const check = await client.query("SELECT COUNT(*) FROM master_data.vehicles");
    if (parseInt(check.rows[0].count) === 0) {
      const res = await client.query(`
        INSERT INTO master_data.vehicles 
          (machine_id, registration_number, office_id, status)
        SELECT 
          id, 
          machine_number, 
          CASE WHEN office_id ~ '^[0-9]+$' THEN office_id::integer ELSE NULL END,
          '運用中'
        FROM master_data.machines
        ON CONFLICT DO NOTHING
      `);
      console.log(`✅ Migrated ${res.rowCount} machines to vehicles table.`);
    } else {
      console.log(`Vehicles table already has ${check.rows[0].count} rows. Skipping migration.`);
    }

    await client.end();
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

migrateData();
