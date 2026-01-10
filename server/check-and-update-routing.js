import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 移動したテーブルのマッピング
const schemaUpdates = {
  'support_flows': { oldSchema: 'public', newSchema: 'operations' },
  'support_history': { oldSchema: 'public', newSchema: 'operations' },
  'emergency_flows': { oldSchema: 'public', newSchema: 'emergency' },
  'messages': { oldSchema: 'public', newSchema: 'emergency' },
  'media': { oldSchema: 'public', newSchema: 'emergency' },
  'images': { oldSchema: 'public', newSchema: 'emergency' },
  'image_data': { oldSchema: 'public', newSchema: 'emergency' },
  'chat_exports': { oldSchema: 'public', newSchema: 'emergency' },
  'chat_history_backup': { oldSchema: 'public', newSchema: 'emergency' },
  'fault_history': { oldSchema: 'public', newSchema: 'maintenance' },
};

async function checkAndUpdateRouting() {
  console.log('=== app_resource_routing 更新チェック ===\n');
  
  // 現在のルーティング設定を取得
  const currentRoutingQuery = `
    SELECT 
      routing_id,
      app_id,
      logical_resource_name,
      physical_schema,
      physical_table,
      is_readonly,
      is_active
    FROM public.app_resource_routing
    ORDER BY physical_schema, physical_table;
  `;
  
  const result = await pool.query(currentRoutingQuery);
  
  console.log(`現在のルーティングレコード数: ${result.rows.length}\n`);
  
  // 更新が必要なレコードを特定
  const updates = [];
  
  result.rows.forEach(row => {
    const tableName = row.physical_table;
    const currentSchema = row.physical_schema;
    
    if (schemaUpdates[tableName] && currentSchema === schemaUpdates[tableName].oldSchema) {
      updates.push({
        routing_id: row.routing_id,
        app_id: row.app_id,
        logical_name: row.logical_resource_name,
        table: tableName,
        oldSchema: currentSchema,
        newSchema: schemaUpdates[tableName].newSchema
      });
    }
  });
  
  if (updates.length === 0) {
    console.log('✅ 更新が必要なルーティングはありません\n');
  } else {
    console.log(`⚠️  更新が必要なルーティング: ${updates.length}件\n`);
    
    updates.forEach(u => {
      console.log(`[${u.routing_id}] ${u.logical_name}`);
      console.log(`  アプリ: ${u.app_id}`);
      console.log(`  テーブル: ${u.table}`);
      console.log(`  変更: ${u.oldSchema} → ${u.newSchema}`);
      console.log('');
    });
  }
  
  // 全ルーティングを表示
  console.log('=== 現在のルーティング設定一覧 ===\n');
  
  const schemas = ['public', 'master_data', 'operations', 'inspections', 'emergency', 'maintenance'];
  
  for (const schema of schemas) {
    const schemaRoutes = result.rows.filter(r => r.physical_schema === schema);
    if (schemaRoutes.length > 0) {
      console.log(`【${schema}】`);
      schemaRoutes.forEach(r => {
        const status = r.is_active ? '✓' : '✗';
        const readonly = r.is_readonly ? '[RO]' : '[RW]';
        console.log(`  ${status} ${r.logical_resource_name} → ${r.physical_table} ${readonly}`);
      });
      console.log('');
    }
  }
  
  return updates;
}

async function updateRouting(updates, dryRun = true) {
  if (updates.length === 0) {
    return;
  }
  
  console.log('=== ルーティング更新処理 ===\n');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN モード - 実際の更新は行いません\n');
    updates.forEach(u => {
      console.log(`UPDATE public.app_resource_routing`);
      console.log(`SET physical_schema = '${u.newSchema}'`);
      console.log(`WHERE routing_id = ${u.routing_id};`);
      console.log('');
    });
    console.log('実行するには --execute オプションを付けてください');
  } else {
    console.log('🚀 実行モード - ルーティングを更新します\n');
    
    try {
      await pool.query('BEGIN');
      
      for (const u of updates) {
        await pool.query(
          'UPDATE public.app_resource_routing SET physical_schema = $1 WHERE routing_id = $2',
          [u.newSchema, u.routing_id]
        );
        console.log(`✅ [${u.routing_id}] ${u.logical_name}: ${u.oldSchema} → ${u.newSchema}`);
      }
      
      await pool.query('COMMIT');
      console.log(`\n✅ ${updates.length}件のルーティングを更新しました`);
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('❌ 更新に失敗しました:', error.message);
      throw error;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  const updates = await checkAndUpdateRouting();
  await updateRouting(updates, dryRun);
}

main()
  .then(() => pool.end())
  .catch(error => {
    console.error('エラー:', error);
    pool.end();
    process.exit(1);
  });
