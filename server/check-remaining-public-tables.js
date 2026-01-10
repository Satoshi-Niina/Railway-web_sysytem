import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkRemainingPublicTables() {
  console.log('=== publicスキーマ残存テーブルの詳細調査 ===\n');
  
  // publicスキーマのテーブル一覧
  const query = `
    SELECT 
      table_name,
      (SELECT COUNT(*) FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = t.table_name) as column_count,
      pg_size_pretty(pg_total_relation_size(quote_ident('public') || '.' || quote_ident(table_name))) as size
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  
  const result = await pool.query(query);
  
  console.log('【残っているテーブル】\n');
  
  for (const row of result.rows) {
    console.log(`■ ${row.table_name}`);
    console.log(`  カラム数: ${row.column_count}`);
    console.log(`  サイズ: ${row.size}`);
    
    // レコード数を取得
    try {
      const countResult = await pool.query(`SELECT COUNT(*) FROM public."${row.table_name}"`);
      console.log(`  レコード数: ${countResult.rows[0].count}`);
    } catch (error) {
      console.log(`  レコード数: 確認不可`);
    }
    
    // カラム情報を取得
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `;
    const columnsResult = await pool.query(columnsQuery, [row.table_name]);
    
    console.log('  カラム:');
    columnsResult.rows.forEach(col => {
      console.log(`    - ${col.column_name} (${col.data_type})`);
    });
    
    // 推奨アクション
    let recommendation = '';
    switch(row.table_name) {
      case 'access_token_policy':
      case 'app_resource_routing':
      case 'gateway_access_logs':
      case 'schema_migrations':
        recommendation = '✓ 基盤テーブル - publicに残すべき';
        break;
      case 'chat_history':
        recommendation = '⚠ master_data.chat_history と重複 - 統合または削除を検討';
        break;
      case 'documents':
        recommendation = '⚠ 用途確認が必要 - master_dataまたは適切なスキーマへ移動を検討';
        break;
      case 'history_images':
        recommendation = '⚠ 用途確認が必要 - maintenanceまたはemergencyへの移動を検討';
        break;
      default:
        recommendation = '? 用途不明 - 調査が必要';
    }
    
    console.log(`  推奨: ${recommendation}`);
    console.log('');
  }
  
  // chat_history の重複確認
  console.log('\n=== chat_history 重複調査 ===\n');
  
  try {
    const publicCount = await pool.query('SELECT COUNT(*) FROM public.chat_history');
    const masterCount = await pool.query('SELECT COUNT(*) FROM master_data.chat_history');
    
    console.log(`public.chat_history: ${publicCount.rows[0].count} レコード`);
    console.log(`master_data.chat_history: ${masterCount.rows[0].count} レコード`);
    
    // カラム比較
    const publicCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'chat_history'
      ORDER BY ordinal_position
    `);
    
    const masterCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'master_data' AND table_name = 'chat_history'
      ORDER BY ordinal_position
    `);
    
    console.log('\npublic.chat_history カラム:');
    console.log(publicCols.rows.map(r => r.column_name).join(', '));
    
    console.log('\nmaster_data.chat_history カラム:');
    console.log(masterCols.rows.map(r => r.column_name).join(', '));
    
    if (publicCols.rows.length === masterCols.rows.length) {
      const allMatch = publicCols.rows.every((col, idx) => 
        col.column_name === masterCols.rows[idx].column_name
      );
      if (allMatch) {
        console.log('\n✓ カラム構造は同じです');
      } else {
        console.log('\n⚠ カラム名が異なります');
      }
    } else {
      console.log('\n⚠ カラム数が異なります');
    }
    
  } catch (error) {
    console.log('chat_history の比較中にエラー:', error.message);
  }
  
  // サマリー
  console.log('\n\n=== 推奨アクション ===\n');
  console.log('1. 基盤テーブル（そのまま）:');
  console.log('   - access_token_policy');
  console.log('   - app_resource_routing');
  console.log('   - gateway_access_logs');
  console.log('   - schema_migrations');
  console.log('');
  console.log('2. 要調査・整理:');
  console.log('   - chat_history → master_dataと重複、統合検討');
  console.log('   - documents → 用途確認後、適切なスキーマへ');
  console.log('   - history_images → 用途確認後、適切なスキーマへ');
}

checkRemainingPublicTables()
  .then(() => pool.end())
  .catch(error => {
    console.error('エラー:', error);
    pool.end();
    process.exit(1);
  });
