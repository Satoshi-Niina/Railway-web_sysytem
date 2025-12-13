import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/webappdb',
  ssl: false,
});

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to database');
    
    const result = await client.query('SELECT NOW(), current_database(), version()');
    console.log('Current time:', result.rows[0].now);
    console.log('Database:', result.rows[0].current_database);
    console.log('Version:', result.rows[0].version.split('\n')[0]);
    
    // Check schemas
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `);
    console.log('\nAvailable schemas:');
    schemas.rows.forEach(row => console.log('  -', row.schema_name));
    
    // Check tables
    const tables = await client.query(`
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE schemaname IN ('master_data', 'operations', 'inspections', 'maintenance')
      ORDER BY schemaname, tablename
    `);
    console.log('\nTables in custom schemas:');
    tables.rows.forEach(row => console.log(`  - ${row.schemaname}.${row.tablename}`));
    
    client.release();
    await pool.end();
    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
