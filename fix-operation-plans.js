import pool from './server/db.js';

async function fixOperationPlans() {
  try {
    console.log('\n=== Fixing Operation Plans Vehicle IDs ===\n');
    
    // 既存の運用計画データを確認
    const existingPlans = await pool.query(`
      SELECT id, vehicle_id, plan_date
      FROM operations.operation_plans
      ORDER BY id
      LIMIT 20
    `);
    
    console.log('=== Existing Plans ===');
    existingPlans.rows.forEach(row => {
      console.log(`Plan ${row.id}: vehicle_id=${row.vehicle_id} (type: ${typeof row.vehicle_id}), date=${row.plan_date}`);
    });
    
    // 車両IDのマッピング（数値 -> UUID）を取得
    const machines = await pool.query(`
      SELECT id, machine_number
      FROM master_data.machines
      ORDER BY machine_number
    `);
    
    console.log('\n=== Machine ID Mapping ===');
    machines.rows.forEach(row => {
      console.log(`Machine ${row.machine_number}: ${row.id}`);
    });
    
    // 数値vehicle_idを持つ計画を確認
    const numericalVehiclesQuery = await pool.query(`
      SELECT DISTINCT vehicle_id
      FROM operations.operation_plans
      WHERE vehicle_id ~ '^[0-9]+$'
    `);
    
    console.log('\n=== Numerical Vehicle IDs in Plans ===');
    console.log(numericalVehiclesQuery.rows);
    
    // NOTE: 実際のマイグレーションは危険なので、ここではデータ確認のみ
    // 修正が必要な場合は、ユーザーの承認を得てから実行
    
    console.log('\n=== Migration Required ===');
    console.log('Old numerical vehicle_ids need to be mapped to UUIDs.');
    console.log('Please confirm the mapping before running the migration.');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixOperationPlans();
