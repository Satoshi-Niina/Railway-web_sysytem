import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/webappdb';

console.log('Testing database connection...');
console.log('DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false,
});

async function test() {
  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connected to database successfully!');
    
    const result = await client.query('SELECT NOW(), version()');
    console.log('✅ Query executed:', result.rows[0]);
    
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    `);
    console.log('✅ Available schemas:', schemas.rows.map(r => r.schema_name).join(', '));
    
    const tables = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname IN ('master_data', 'operations')
    `);
    console.log('✅ Tables found:');
    tables.rows.forEach(r => console.log(`  - ${r.schemaname}.${r.tablename}`));
    
    client.release();
    await pool.end();
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    process.exit(1);
  }
}

test();
