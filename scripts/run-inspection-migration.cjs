const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// データベース接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/webappdb',
  ssl: false,
});

async function runMigration() {
  try {
    console.log('📋 SQLファイルを読み込み中...');
    const sqlPath = path.join(__dirname, 'add-inspection-cycle-management.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔄 マイグレーションを実行中...');
    await pool.query(sql);
    
    console.log('✅ テーブルの作成が完了しました!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.error('詳細:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
