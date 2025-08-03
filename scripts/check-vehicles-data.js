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

async function checkVehiclesData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking vehicles data and management office relationships...');
    
    // 車両データを管理事業所情報と一緒に取得
    const result = await client.query(`
      SELECT 
        v.id,
        v.machine_number,
        v.vehicle_type,
        v.model,
        v.manufacturer,
        v.acquisition_date,
        v.type_approval_start_date,
        v.type_approval_duration,
        v.special_notes,
        v.management_office_id,
        v.status,
        v.created_at,
        v.updated_at,
        mo.office_name,
        mo.office_code
      FROM vehicles v
      LEFT JOIN management_offices mo ON v.management_office_id = mo.id
      WHERE v.status = 'active'
      ORDER BY v.id
    `);
    
    console.log(`📊 Found ${result.rows.length} active vehicles:`);
    
    if (result.rows.length === 0) {
      console.log('❌ No active vehicles found in database');
    } else {
      result.rows.forEach((vehicle, index) => {
        console.log(`\n${index + 1}. Vehicle ID: ${vehicle.id}`);
        console.log(`   - Machine Number: ${vehicle.machine_number}`);
        console.log(`   - Vehicle Type: ${vehicle.vehicle_type}`);
        console.log(`   - Model: ${vehicle.model || 'N/A'}`);
        console.log(`   - Manufacturer: ${vehicle.manufacturer || 'N/A'}`);
        console.log(`   - Acquisition Date: ${vehicle.acquisition_date || 'N/A'}`);
        console.log(`   - Type Approval Start Date: ${vehicle.type_approval_start_date || 'N/A'}`);
        console.log(`   - Type Approval Duration: ${vehicle.type_approval_duration || 'N/A'} months`);
        console.log(`   - Special Notes: ${vehicle.special_notes || 'N/A'}`);
        console.log(`   - Management Office ID: ${vehicle.management_office_id || 'NULL'}`);
        console.log(`   - Management Office: ${vehicle.office_name ? `${vehicle.office_code} - ${vehicle.office_name}` : 'NOT ASSIGNED'}`);
        console.log(`   - Status: ${vehicle.status}`);
      });
    }
    
    // 統計情報
    console.log('\n📊 Statistics:');
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(management_office_id) as vehicles_with_office,
        COUNT(*) - COUNT(management_office_id) as vehicles_without_office
      FROM vehicles 
      WHERE status = 'active'
    `);
    
    const stats = statsResult.rows[0];
    console.log(`  - Total active vehicles: ${stats.total_vehicles}`);
    console.log(`  - Vehicles with management office: ${stats.vehicles_with_office}`);
    console.log(`  - Vehicles without management office: ${stats.vehicles_without_office}`);
    
    // 管理事業所別の車両数
    console.log('\n📊 Vehicles by management office:');
    const officeStatsResult = await client.query(`
      SELECT 
        mo.office_name,
        mo.office_code,
        COUNT(v.id) as vehicle_count
      FROM management_offices mo
      LEFT JOIN vehicles v ON mo.id = v.management_office_id AND v.status = 'active'
      GROUP BY mo.id, mo.office_name, mo.office_code
      ORDER BY vehicle_count DESC, mo.office_name
    `);
    
    officeStatsResult.rows.forEach((office) => {
      console.log(`  - ${office.office_code} - ${office.office_name}: ${office.vehicle_count} vehicles`);
    });
    
  } catch (error) {
    console.error('❌ Error checking vehicles data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// スクリプト実行
checkVehiclesData()
  .then(() => {
    console.log('\n🎉 Check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }); 