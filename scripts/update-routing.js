import db from '../server/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateRouting() {
  try {
    console.log('📝 SQLスクリプトを読み込み中...');
    const sqlPath = join(__dirname, 'setup-app-resource-routing.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('\n🔧 app_resource_routingを更新中...');
    await db.query(sql);
    console.log('✅ 更新完了');

    console.log('\n📊 更新結果を確認中...');
    const result = await db.query(`
      SELECT logical_resource_name, physical_schema, physical_table 
      FROM public.app_resource_routing 
      WHERE app_id = 'railway-maintenance' 
      ORDER BY logical_resource_name
    `);

    console.log(`\n✅ ${result.rows.length}件のルーティングが登録されています:\n`);
    result.rows.forEach(row => {
      console.log(`  ${row.logical_resource_name.padEnd(35)} → ${row.physical_schema}.${row.physical_table}`);
    });

    console.log('\n✅ すべての処理が完了しました');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

updateRouting();
