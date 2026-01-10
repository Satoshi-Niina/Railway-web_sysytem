import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 環境変数の読み込み（開発環境用）
const env = process.env.NODE_ENV || 'development';
if (env === 'development') {
  dotenv.config({ path: resolve(__dirname, '../.env.development') });
}

console.log('=== Database Connection Info ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
