import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config();

// 環境変数から接続情報を取得
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/webappdb',
  ssl: false,
});

async function runMigration() {
  try {
    console.log('📋 Reading SQL file...');
    const sqlPath = path.join(__dirname, '..', 'scripts', 'add-inspection-cycle-management.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔄 Executing migration...');
    await pool.query(sql);
    
    console.log('✅ Tables created successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
