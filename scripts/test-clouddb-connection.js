// データベース接続テストスクリプト
import pg from 'pg';
const { Pool } = pg;

const connectionString = 'postgresql://postgres:Takabeni@localhost:55432/webappdb';

console.log('🔍 CloudDB接続テスト開始...');
console.log(`接続先: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

const pool = new Pool({
  connectionString,
  ssl: false,
  connectionTimeoutMillis: 10000,
});

try {
  console.log('📡 接続中...');
  const client = await pool.connect();
  console.log('✅ 接続成功！');
  
  const result = await client.query('SELECT version(), current_database(), current_user');
  console.log('\n📊 データベース情報:');
  console.log('Version:', result.rows[0].version);
  console.log('Database:', result.rows[0].current_database);
  console.log('User:', result.rows[0].current_user);
  
  // テーブル一覧を取得
  const tables = await client.query(`
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename
    LIMIT 10
  `);
  
  console.log('\n📋 テーブル一覧（最初の10件）:');
  tables.rows.forEach(row => {
    console.log(`  - ${row.schemaname}.${row.tablename}`);
  });
  
  client.release();
  await pool.end();
  
  console.log('\n✅ すべてのテスト成功！');
  process.exit(0);
} catch (error) {
  console.error('\n❌ エラー発生:', error.message);
  console.error('詳細:', error);
  await pool.end();
  process.exit(1);
}
