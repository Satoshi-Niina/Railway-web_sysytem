import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

async function runMigration() {
  // 環境変数から接続情報を取得
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔄 データベースに接続中...');
    await client.connect();
    console.log('✅ 接続成功');
    
    console.log('🔄 is_as_planned カラムを追加中...');
    
    const result = await client.query(`
      ALTER TABLE operations.operation_records 
      ADD COLUMN IF NOT EXISTS is_as_planned BOOLEAN DEFAULT false;
    `);
    
    console.log('✅ is_as_planned カラムを追加しました');
    
    // 確認
    const checkResult = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'operations' 
        AND table_name = 'operation_records' 
        AND column_name = 'is_as_planned';
    `);
    
    console.log('\n📋 カラム情報:');
    console.table(checkResult.rows);
    
    console.log('\n✅ マイグレーション完了！');
  } catch (error) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
