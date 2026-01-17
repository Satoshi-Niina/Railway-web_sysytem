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

async function inspectColumns() {
  try {
    await client.connect();
    console.log('--- TABLE COLUMN INSPECTION ---');
    
    const tables = ['vehicles', 'machines', 'management_offices', 'machine_types'];
    
    for (const table of tables) {
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'master_data' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      console.log(`\n[master_data.${table}] columns:`);
      res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
    }

    await client.end();
  } catch (err) {
    console.error('Inspection failed:', err.message);
    process.exit(1);
  }
}

inspectColumns();
