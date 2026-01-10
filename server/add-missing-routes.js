import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 追加が必要なルーティング定義
const newRoutes = [
  // operations スキーマ
  { app_id: 'operations_app', logical_name: 'SUPPORT_FLOWS', schema: 'operations', table: 'support_flows', readonly: false },
  { app_id: 'operations_app', logical_name: 'SUPPORT_HISTORY', schema: 'operations', table: 'support_history', readonly: false },
  { app_id: 'operations_app', logical_name: 'OPERATION_PLANS', schema: 'operations', table: 'operation_plans', readonly: false },
  
  // emergency スキーマ
  { app_id: 'emergency_app', logical_name: 'EMERGENCY_FLOWS', schema: 'emergency', table: 'emergency_flows', readonly: false },
  { app_id: 'emergency_app', logical_name: 'MESSAGES', schema: 'emergency', table: 'messages', readonly: false },
  { app_id: 'emergency_app', logical_name: 'MEDIA', schema: 'emergency', table: 'media', readonly: false },
  { app_id: 'emergency_app', logical_name: 'IMAGES', schema: 'emergency', table: 'images', readonly: false },
  { app_id: 'emergency_app', logical_name: 'IMAGE_DATA', schema: 'emergency', table: 'image_data', readonly: false },
  { app_id: 'emergency_app', logical_name: 'CHAT_EXPORTS', schema: 'emergency', table: 'chat_exports', readonly: false },
  { app_id: 'emergency_app', logical_name: 'CHAT_HISTORY_BACKUP', schema: 'emergency', table: 'chat_history_backup', readonly: false },
  
  // maintenance スキーマ
  { app_id: 'maintenance_app', logical_name: 'FAULT_HISTORY', schema: 'maintenance', table: 'fault_history', readonly: false },
];

async function addMissingRoutes(dryRun = true) {
  console.log('=== ルーティングエントリ追加 ===\n');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN モード\n');
  } else {
    console.log('🚀 実行モード\n');
  }
  
  // 既存のルーティングを確認
  const existing = await pool.query(
    'SELECT logical_resource_name, physical_table FROM public.app_resource_routing'
  );
  const existingSet = new Set(
    existing.rows.map(r => `${r.logical_resource_name}:${r.physical_table}`)
  );
  
  const toAdd = newRoutes.filter(
    route => !existingSet.has(`${route.logical_name}:${route.table}`)
  );
  
  if (toAdd.length === 0) {
    console.log('✅ 追加が必要なルーティングはありません');
    return;
  }
  
  console.log(`追加予定: ${toAdd.length}件\n`);
  
  if (dryRun) {
    toAdd.forEach(route => {
      console.log(`INSERT INTO public.app_resource_routing`);
      console.log(`  (app_id, logical_resource_name, physical_schema, physical_table, is_readonly, is_active)`);
      console.log(`VALUES`);
      console.log(`  ('${route.app_id}', '${route.logical_name}', '${route.schema}', '${route.table}', ${route.readonly}, true);`);
      console.log('');
    });
    console.log('実行するには --execute オプションを付けてください');
  } else {
    try {
      await pool.query('BEGIN');
      
      for (const route of toAdd) {
        await pool.query(
          `INSERT INTO public.app_resource_routing 
           (app_id, logical_resource_name, physical_schema, physical_table, is_readonly, is_active)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [route.app_id, route.logical_name, route.schema, route.table, route.readonly]
        );
        console.log(`✅ ${route.logical_name} → ${route.schema}.${route.table}`);
      }
      
      await pool.query('COMMIT');
      console.log(`\n✅ ${toAdd.length}件のルーティングを追加しました`);
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('❌ 追加に失敗しました:', error.message);
      throw error;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  await addMissingRoutes(dryRun);
  
  if (!dryRun) {
    // 最終確認
    console.log('\n=== 最終ルーティング一覧 ===\n');
    const result = await pool.query(`
      SELECT physical_schema, COUNT(*) as count
      FROM public.app_resource_routing
      GROUP BY physical_schema
      ORDER BY physical_schema
    `);
    
    result.rows.forEach(row => {
      console.log(`  ${row.physical_schema}: ${row.count}件`);
    });
  }
}

main()
  .then(() => pool.end())
  .catch(error => {
    console.error('エラー:', error);
    pool.end();
    process.exit(1);
  });
