import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 移動するテーブルの定義
const tableMigrations = [
  // operations スキーマへ
  { table: 'support_flows', from: 'public', to: 'operations' },
  { table: 'support_history', from: 'public', to: 'operations' },
  
  // emergency スキーマへ
  { table: 'emergency_flows', from: 'public', to: 'emergency' },
  { table: 'messages', from: 'public', to: 'emergency' },
  { table: 'media', from: 'public', to: 'emergency' },
  { table: 'images', from: 'public', to: 'emergency' },
  { table: 'image_data', from: 'public', to: 'emergency' },
  { table: 'chat_exports', from: 'public', to: 'emergency' },
  { table: 'chat_history_backup', from: 'public', to: 'emergency' },
  
  // maintenance スキーマへ
  { table: 'fault_history', from: 'public', to: 'maintenance' },
];

async function checkTableExists(schema, table) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = $1 AND table_name = $2
    );
  `;
  const result = await pool.query(query, [schema, table]);
  return result.rows[0].exists;
}

async function checkTableDependencies(schema, table) {
  // 外部キー制約を確認
  const fkQuery = `
    SELECT
      tc.constraint_name,
      tc.table_schema,
      tc.table_name,
      kcu.column_name,
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND (tc.table_schema = $1 AND tc.table_name = $2)
       OR (ccu.table_schema = $1 AND ccu.table_name = $2);
  `;
  
  const result = await pool.query(fkQuery, [schema, table]);
  return result.rows;
}

async function getTableRowCount(schema, table) {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM "${schema}"."${table}"`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    return -1;
  }
}

async function migrateTable(migration, dryRun = true) {
  const { table, from, to } = migration;
  
  console.log(`\n=== ${table} の移行処理 ===`);
  console.log(`移動元: ${from}`);
  console.log(`移動先: ${to}`);
  
  // テーブルの存在確認
  const existsInSource = await checkTableExists(from, table);
  const existsInTarget = await checkTableExists(to, table);
  
  if (!existsInSource) {
    console.log(`⚠️  ${from}.${table} が存在しません - スキップ`);
    return { success: false, reason: 'source_not_found' };
  }
  
  if (existsInTarget) {
    console.log(`⚠️  ${to}.${table} は既に存在します - スキップ`);
    return { success: false, reason: 'target_exists' };
  }
  
  // レコード数確認
  const rowCount = await getTableRowCount(from, table);
  console.log(`レコード数: ${rowCount >= 0 ? rowCount : '確認不可'}`);
  
  // 依存関係確認
  const dependencies = await checkTableDependencies(from, table);
  if (dependencies.length > 0) {
    console.log(`外部キー制約: ${dependencies.length}件`);
    dependencies.forEach(dep => {
      console.log(`  - ${dep.table_schema}.${dep.table_name}.${dep.column_name} -> ${dep.foreign_table_schema}.${dep.foreign_table_name}.${dep.foreign_column_name}`);
    });
  } else {
    console.log(`外部キー制約: なし`);
  }
  
  if (dryRun) {
    console.log(`\n[DRY RUN] 実行予定のSQL:`);
    console.log(`ALTER TABLE "${from}"."${table}" SET SCHEMA "${to}";`);
    return { success: true, dryRun: true };
  } else {
    try {
      await pool.query(`ALTER TABLE "${from}"."${table}" SET SCHEMA "${to}";`);
      console.log(`✅ ${table} を ${from} から ${to} へ移動しました`);
      return { success: true, dryRun: false };
    } catch (error) {
      console.error(`❌ 移動に失敗: ${error.message}`);
      return { success: false, reason: 'migration_failed', error: error.message };
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  console.log('=== CloudDB テーブル移行ツール ===\n');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN モード - 実際の変更は行いません');
    console.log('実行するには --execute オプションを付けてください\n');
  } else {
    console.log('🚀 実行モード - テーブルを実際に移動します\n');
  }
  
  const results = [];
  
  for (const migration of tableMigrations) {
    const result = await migrateTable(migration, dryRun);
    results.push({ ...migration, ...result });
  }
  
  // サマリー
  console.log('\n\n=== 移行サマリー ===');
  
  const successCount = results.filter(r => r.success && !r.dryRun).length;
  const dryRunCount = results.filter(r => r.success && r.dryRun).length;
  const skipCount = results.filter(r => !r.success).length;
  
  console.log(`成功: ${successCount}`);
  console.log(`DRY RUN: ${dryRunCount}`);
  console.log(`スキップ: ${skipCount}`);
  
  if (skipCount > 0) {
    console.log('\nスキップされたテーブル:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.table}: ${r.reason}`);
    });
  }
  
  if (dryRun && dryRunCount > 0) {
    console.log('\n✅ DRY RUNが完了しました');
    console.log('問題がなければ --execute オプションで実行してください:');
    console.log('node migrate-tables-to-schemas.js --execute');
  }
}

main()
  .then(() => pool.end())
  .catch(error => {
    console.error('エラー:', error);
    pool.end();
    process.exit(1);
  });
