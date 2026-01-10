import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanupRemainingTables() {
  console.log('=== publicスキーマ追加整理 ===\n');
  
  try {
    await pool.query('BEGIN');
    
    // 1. documentsをmaster_dataへ移動（ドキュメント管理は共有マスタ）
    console.log('1. documents テーブルを master_data へ移動...');
    await pool.query('ALTER TABLE public.documents SET SCHEMA master_data');
    console.log('   ✅ 完了\n');
    
    // 2. history_imagesをmaintenanceへ移動（故障履歴画像）
    console.log('2. history_images テーブルを maintenance へ移動...');
    await pool.query('ALTER TABLE public.history_images SET SCHEMA maintenance');
    console.log('   ✅ 完了\n');
    
    // 3. public.chat_historyを削除（master_dataで管理、データなし）
    console.log('3. public.chat_history テーブルを削除...');
    console.log('   （master_data.chat_historyと重複、レコード数0のため削除）');
    await pool.query('DROP TABLE IF EXISTS public.chat_history CASCADE');
    console.log('   ✅ 完了\n');
    
    await pool.query('COMMIT');
    
    // 最終確認
    console.log('=== 最終確認 ===\n');
    
    const publicTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const result = await pool.query(publicTablesQuery);
    
    console.log('publicスキーマに残っているテーブル:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    console.log('\n✅ publicスキーマの整理が完了しました！');
    console.log('\n【publicスキーマの役割】');
    console.log('  - 認証・アクセス制御（access_token_policy）');
    console.log('  - リソースルーティング（app_resource_routing）');
    console.log('  - アクセスログ（gateway_access_logs）');
    console.log('  - マイグレーション履歴（schema_migrations）');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ エラーが発生しました:', error.message);
    throw error;
  }
}

cleanupRemainingTables()
  .then(() => pool.end())
  .catch(error => {
    console.error('処理失敗:', error);
    pool.end();
    process.exit(1);
  });
