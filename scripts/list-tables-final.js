import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';

// .env.local から読み込み
dotenv.config({ path: path.join(process.cwd(), 'client', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('master_data', 'operations', 'public')
      ORDER BY table_schema, table_name;
    `);
    console.log("=== Found Tables ===");
    console.table(res.rows);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

checkTables();
