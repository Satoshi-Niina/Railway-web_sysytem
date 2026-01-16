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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
