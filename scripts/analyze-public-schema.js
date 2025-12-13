// publicスキーマの内容を確認するスクリプト
import pg from 'pg';

const { Pool } = pg;

import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/webappdb',
  ssl: false,
});

async function checkPublicSchema() {
  const client = await pool.connect();
  
  try {
    console.log('=== publicスキーマの分析 ===\n');
    
    // publicスキーマのテーブル一覧
    const tables = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`publicスキーマには ${tables.rows.length} テーブルが存在します:\n`);
    
    for (const table of tables.rows) {
      console.log(`📋 ${table.table_name} (${table.column_count}カラム)`);
      
      // 各テーブルのデータ件数を確認
      try {
        const count = await client.query(`SELECT COUNT(*) as count FROM public.${table.table_name}`);
        console.log(`   データ件数: ${count.rows[0].count}件`);
      } catch (error) {
        console.log(`   データ件数: 取得エラー`);
      }
      
      // カラム情報を表示
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
        LIMIT 5;
      `, [table.table_name]);
      
      console.log('   主要カラム:');
      columns.rows.forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type})`);
      });
      console.log('');
    }
    
    // 新しいスキーマとの重複チェック
    console.log('\n=== 重複テーブルのチェック ===\n');
    
    const duplicates = await client.query(`
      SELECT 
        p.table_name as public_table,
        CASE 
          WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'master_data' AND table_name = p.table_name) THEN 'master_data'
          WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'operations' AND table_name = p.table_name) THEN 'operations'
          WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'inspections' AND table_name = p.table_name) THEN 'inspections'
          WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'maintenance' AND table_name = p.table_name) THEN 'maintenance'
          ELSE NULL
        END as exists_in_schema
      FROM information_schema.tables p
      WHERE p.table_schema = 'public'
      AND p.table_type = 'BASE TABLE'
      ORDER BY p.table_name;
    `);
    
    const hasDuplicates = duplicates.rows.filter(r => r.exists_in_schema !== null);
    
    if (hasDuplicates.length > 0) {
      console.log('⚠️ 以下のテーブルが新しいスキーマと重複しています:');
      hasDuplicates.forEach(dup => {
        console.log(`  - ${dup.public_table} → ${dup.exists_in_schema}スキーマにも存在`);
      });
    } else {
      console.log('✅ 重複テーブルはありません（publicスキーマは旧データ）');
    }
    
    console.log('\n=== publicスキーマの役割 ===');
    console.log(`
📌 publicスキーマとは:
  - PostgreSQLのデフォルトスキーマ
  - スキーマを指定しない場合、自動的にpublicが使用される
  - 新規インストール時から存在する標準スキーマ

📋 現在の状況:
  - publicスキーマには ${tables.rows.length} テーブルが存在
  - 新しいスキーマ構造（master_data, operations等）に移行済み
  - publicスキーマのテーブルは旧データまたはテスト用の可能性

🔧 推奨アクション:
  1. publicスキーマのテーブルが旧バージョンのデータか確認
  2. 必要なデータがあれば新しいスキーマに移行
  3. 不要であればpublicスキーマのテーブルを削除
  4. publicスキーマ自体は削除しない（PostgreSQLの標準）

⚠️ 注意:
  - publicスキーマ自体を削除すると問題が発生する可能性あり
  - テーブルのみ削除し、スキーマは残すことを推奨
    `);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkPublicSchema().catch(console.error);
