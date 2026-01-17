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

async function inspectFullDb() {
  try {
    await client.connect();
    console.log('--- DATABASE INSPECTION ---');

    // 1. All schemas
    const schemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')");
    console.log('Schemas:', schemas.rows.map(r => r.schema_name));

    // 2. All tables related to vehicles
    const tables = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%vehicle%' OR table_name LIKE '%machine%'");
    console.log('\nRelevant Tables:');
    for (const row of tables.rows) {
      const countRes = await client.query(`SELECT COUNT(*) FROM ${row.table_schema}.${row.table_name}`).catch(() => ({rows:[{count:'ERROR'}]}));
      console.log(`- ${row.table_schema}.${row.table_name}: ${countRes.rows[0].count} rows`);
    }

    // 3. Check data in master_data.vehicles
    if (tables.rows.some(t => t.table_schema === 'master_data' && t.table_name === 'vehicles')) {
        const sample = await client.query("SELECT * FROM master_data.vehicles LIMIT 3");
        console.log('\nSample from master_data.vehicles:', sample.rows);
    }

    await client.end();
  } catch (err) {
    console.error('Inspection failed:', err.message);
  }
}

inspectFullDb();
