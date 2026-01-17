import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 環境変数の読み込み
const env = process.env.NODE_ENV || 'development';
if (env === 'production') {
  // 本番環境: server/ ディレクトリ内の .env.production を優先、
  // なければ環境変数から直接読み込まれる
  dotenv.config({ path: resolve(__dirname, '.env.production') });
} else {
  // 開発環境: ルートディレクトリの .env.development
  dotenv.config({ path: resolve(__dirname, '../.env.development') });
}

console.log('=== Database Connection Info ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
console.log('DATABASE_URL_PRODUCTION:', process.env.DATABASE_URL_PRODUCTION?.replace(/:[^:@]+@/, ':***@'));
console.log('CLOUD_SQL_CONNECTION_NAME:', process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME);

// 接続文字列の決定
let connectionString = process.env.DATABASE_URL;
let useCloudSqlSocket = false;

// 本番環境の場合、DATABASE_URL_PRODUCTIONを優先使用
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL_PRODUCTION) {
  connectionString = process.env.DATABASE_URL_PRODUCTION;
  console.log('✅ Using DATABASE_URL_PRODUCTION for Cloud SQL Socket connection');
  
  // DATABASE_URL_PRODUCTIONにはCloud SQL Socketパスが既に含まれている
  // 例: postgresql://postgres:password@/dbname?host=/cloudsql/project:region:instance
  useCloudSqlSocket = true;
} else if (process.env.NODE_ENV === 'production' && process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME) {
  // DATABASE_URL_PRODUCTIONがない場合は、DATABASE_URLを変換
  try {
    if (connectionString) {
      const dbUrl = new URL(connectionString);
      const socketPath = `/cloudsql/${process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME}`;
      
      // Remove hostname and port to force socket usage
      dbUrl.hostname = '';
      dbUrl.port = '';
      dbUrl.host = ''; // Clear host
      
      // pg supports host via query param for socket
      dbUrl.searchParams.set('host', socketPath);
      
      // Fix: URL.toString() URL-encodes the path (e.g., %2Fcloudsql%2F...), causing connection failures.
      // We manually decode just the host parameter to ensure it is a valid socket path.
      connectionString = dbUrl.toString().replace(/%2F/g, '/');

      console.log('🔄 Modified connection string for Cloud SQL Socket usage');
      useCloudSqlSocket = true;
    }
  } catch (e) {
    console.error('⚠️ Failed to modify DATABASE_URL for Cloud SQL Socket:', e);
  }
}

// SSL設定の決定
// Cloud SQL Socketを使用する場合はSSLは不要
// DB_SSL_ENABLEDがfalseの場合もSSLは無効
let sslConfig = false;

if (process.env.NODE_ENV === 'production' && !useCloudSqlSocket) {
  // Cloud SQL Socketを使用しない本番環境の場合のみSSLを有効化
  // ただし、DB_SSL_ENABLEDがfalseの場合は無効のまま
  if (process.env.DB_SSL_ENABLED !== 'false') {
    sslConfig = { rejectUnauthorized: false };
  }
}

console.log('SSL Config:', sslConfig);

const pool = new Pool({
  connectionString: connectionString,
  ssl: sslConfig
});

// 接続テスト
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('   URL:', connectionString?.replace(/:[^:@]+@/, ':***@'));
    if (err.code === 'ECONNREFUSED') {
      console.error('   Hint: DB service might not be running or port is incorrect.');
    }
  } else {
    console.log('✅ Database connected successfully');
    try {
      // 検索パスを設定 (master_data, operations, inspections, maintenance, public)
      await client.query('SET search_path TO master_data, operations, inspections, maintenance, public');
      console.log('✅ search_path set to: master_data, operations, inspections, maintenance, public');
      
      const res = await client.query('SELECT current_database(), current_schema()');
      console.log(`📡 Connected to database: ${res.rows[0].current_database} (Schema: ${res.rows[0].current_schema})`);
    } catch (dbErr) {
      console.error('⚠️ Failed to initialize session:', dbErr.message);
    }
    release();
  }
});

export default pool;
