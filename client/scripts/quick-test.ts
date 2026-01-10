import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://pstegsql:Takabeni@localhost:55432/webappdb',
  ssl: false,
  connectionTimeoutMillis: 10000,
});

async function test() {
  try {
    console.log(' CloudDB接続テスト中...');
    const client = await pool.connect();
    console.log(' 接続成功！');
    
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('Version:', result.rows[0].version.substring(0, 50) + '...');
    
    client.release();
    await pool.end();
    console.log(' テスト完了！');
  } catch (error) {
    console.error(' エラー:', error.message);
    await pool.end();
    process.exit(1);
  }
}

test();
