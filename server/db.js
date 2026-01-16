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

let connectionString = process.env.DATABASE_URL;

// Cloud Run Production Environment - Enforce Cloud SQL Socket if variable is present
if (process.env.NODE_ENV === 'production' && process.env.CLOUD_SQL_CONNECTION_NAME) {
  try {
    // If DATABASE_URL is set, we try to inject the socket path
    if (connectionString) {
      const dbUrl = new URL(connectionString);
      const socketPath = `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`;
      
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
    }
  } catch (e) {
    console.error('⚠️ Failed to modify DATABASE_URL for Cloud SQL Socket:', e);
  }
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

// 接続テスト
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('   URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
    if (err.code === 'ECONNREFUSED') {
      console.error('   Hint: DB service might not be running or port is incorrect.');
    }
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

export default pool;
