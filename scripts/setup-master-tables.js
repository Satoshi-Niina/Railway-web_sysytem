const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 環境変数の設定
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL or POSTGRES_URL environment variable is not set');
  process.exit(1);
}

// PostgreSQL接続プールの作成
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function setupMasterTables() {
  const client = await pool.connect();
  
  try {
    console.log('マスタテーブルの作成を開始します...');
    
    // SQLファイルの読み込み
    const sqlFilePath = path.join(__dirname, '23-create-master-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // SQLの実行
    console.log('SQLスクリプトを実行中...');
    await client.query(sqlContent);
    
    console.log('✅ マスタテーブルの作成が完了しました');
    
    // テーブル作成確認
    console.log('\n📊 テーブル作成確認:');
    const result = await client.query(`
      SELECT 
        'management_offices' as table_name,
        COUNT(*) as record_count
      FROM management_offices
      UNION ALL
      SELECT 
        'maintenance_bases' as table_name,
        COUNT(*) as record_count
      FROM maintenance_bases
      UNION ALL
      SELECT 
        'vehicles' as table_name,
        COUNT(*) as record_count
      FROM vehicles
    `);
    
    result.rows.forEach(row => {
      console.log(`  ${row.table_name}: ${row.record_count}件`);
    });
    
    // リレーション確認
    console.log('\n🔗 リレーション確認:');
    const relationResult = await client.query(`
      SELECT 
        mb.base_name,
        mb.base_code,
        mo.office_name,
        mo.office_code
      FROM maintenance_bases mb
      JOIN management_offices mo ON mb.management_office_id = mo.id
      ORDER BY mb.base_name
    `);
    
    console.log('保守基地と事業所のリレーション:');
    relationResult.rows.forEach(row => {
      console.log(`  ${row.base_name} (${row.base_code}) → ${row.office_name} (${row.office_code})`);
    });
    
    const vehicleResult = await client.query(`
      SELECT 
        v.machine_number,
        v.vehicle_type,
        mo.office_name,
        mb.base_name
      FROM vehicles v
      LEFT JOIN management_offices mo ON v.management_office_id = mo.id
      LEFT JOIN maintenance_bases mb ON v.home_base_id = mb.id
      ORDER BY v.machine_number
    `);
    
    console.log('\n車両と事業所・保守基地のリレーション:');
    vehicleResult.rows.forEach(row => {
      console.log(`  ${row.machine_number} (${row.vehicle_type}) → ${row.office_name} / ${row.base_name}`);
    });
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error('詳細:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// スクリプトの実行
setupMasterTables().catch(console.error); 