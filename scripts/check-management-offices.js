const { Pool } = require('pg');

// 環境変数からデータベース接続情報を取得
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL or POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function checkManagementOffices() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking management offices data...');
    
    // 管理事業所のデータを確認
    const result = await client.query(`
      SELECT id, office_name, office_code, created_at, updated_at
      FROM management_offices 
      ORDER BY office_name
    `);
    
    console.log(`📊 Found ${result.rows.length} management offices:`);
    
    if (result.rows.length === 0) {
      console.log('❌ No management offices found in database');
      console.log('💡 You need to create management offices first');
      
      // サンプルデータを挿入するかどうか確認
      console.log('\n🔧 Would you like to create sample management offices? (y/n)');
      // 実際のアプリケーションでは、管理画面から作成することを推奨
    } else {
      result.rows.forEach((office, index) => {
        console.log(`  ${index + 1}. ${office.office_code} - ${office.office_name} (ID: ${office.id})`);
      });
    }
    
    // 車両テーブルの管理事業所IDの状況も確認
    console.log('\n🔍 Checking vehicles table management_office_id...');
    const vehiclesResult = await client.query(`
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(management_office_id) as vehicles_with_office,
        COUNT(*) - COUNT(management_office_id) as vehicles_without_office
      FROM vehicles 
      WHERE status = 'active'
    `);
    
    const stats = vehiclesResult.rows[0];
    console.log(`📊 Vehicle statistics:`);
    console.log(`  - Total vehicles: ${stats.total_vehicles}`);
    console.log(`  - Vehicles with management office: ${stats.vehicles_with_office}`);
    console.log(`  - Vehicles without management office: ${stats.vehicles_without_office}`);
    
  } catch (error) {
    console.error('❌ Error checking management offices:', error);
    throw error;
  } finally {
    client.release();
  }
}

// スクリプト実行
checkManagementOffices()
  .then(() => {
    console.log('🎉 Check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }); 