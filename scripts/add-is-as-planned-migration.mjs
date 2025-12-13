import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 is_as_planned カラムを追加しています...');
    
    // is_as_plannedカラムを追加
    await client.query(`
      ALTER TABLE operations.operation_records 
      ADD COLUMN IF NOT EXISTS is_as_planned BOOLEAN DEFAULT false;
    `);
    
    console.log('✅ is_as_planned カラムを追加しました');
    
    // カラムにコメントを追加
    await client.query(`
      COMMENT ON COLUMN operations.operation_records.is_as_planned 
      IS '計画通りの実績かどうか（true: 計画通り, false: 計画外）';
    `);
    
    console.log('✅ コメントを追加しました');
    
    // 確認
    const result = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'operations' 
        AND table_name = 'operation_records' 
        AND column_name = 'is_as_planned';
    `);
    
    console.log('\n📋 カラム情報:');
    console.table(result.rows);
    
    console.log('\n✅ マイグレーション完了！');
  } catch (error) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
