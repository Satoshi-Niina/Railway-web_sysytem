import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/webappdb'
});

async function checkData() {
  try {
    console.log('=== データベース接続確認 ===\n');
    
    // 運用計画データの確認
    console.log('【運用計画データ】');
    const plansResult = await pool.query(`
      SELECT 
        op.id,
        op.vehicle_id,
        op.plan_date,
        op.shift_type,
        op.start_time,
        op.end_time,
        v.machine_number,
        v.vehicle_type
      FROM operations.operation_plans op
      LEFT JOIN master_data.vehicles v ON op.vehicle_id = v.id
      ORDER BY op.created_at DESC
      LIMIT 5
    `);
    
    console.log(`件数: ${plansResult.rows.length}`);
    if (plansResult.rows.length > 0) {
      console.log('最新のデータ:');
      plansResult.rows.forEach((row, i) => {
        console.log(`\n${i + 1}. ID: ${row.id}`);
        console.log(`   車両: ${row.machine_number} (${row.vehicle_type})`);
        console.log(`   日付: ${row.plan_date}`);
        console.log(`   勤務: ${row.shift_type}`);
        console.log(`   時間: ${row.start_time} - ${row.end_time}`);
      });
    } else {
      console.log('⚠️ データが登録されていません');
    }
    
    // 車両データの確認
    console.log('\n【車両データ】');
    const vehiclesResult = await pool.query(`
      SELECT id, machine_number, vehicle_type, management_office_id
      FROM master_data.vehicles
      LIMIT 5
    `);
    console.log(`件数: ${vehiclesResult.rows.length}`);
    if (vehiclesResult.rows.length > 0) {
      vehiclesResult.rows.forEach(row => {
        console.log(`  - ${row.machine_number} (${row.vehicle_type}) [事業所ID: ${row.management_office_id}]`);
      });
    }
    
    // 基地データの確認
    console.log('\n【基地データ】');
    const basesResult = await pool.query(`
      SELECT id, base_name, management_office_id
      FROM master_data.bases
      LIMIT 5
    `);
    console.log(`件数: ${basesResult.rows.length}`);
    if (basesResult.rows.length > 0) {
      basesResult.rows.forEach(row => {
        console.log(`  - ${row.base_name} [事業所ID: ${row.management_office_id}]`);
      });
    }
    
    // 事業所データの確認
    console.log('\n【事業所データ】');
    const officesResult = await pool.query(`
      SELECT id, office_name, office_code
      FROM master_data.management_offices
      LIMIT 5
    `);
    console.log(`件数: ${officesResult.rows.length}`);
    if (officesResult.rows.length > 0) {
      officesResult.rows.forEach(row => {
        console.log(`  - ${row.office_code}: ${row.office_name}`);
      });
    }
    
  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();
