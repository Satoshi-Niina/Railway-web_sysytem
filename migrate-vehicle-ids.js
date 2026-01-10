import pool from './server/db.js';

async function migrateVehicleIds() {
  try {
    console.log('\n=== Migrating Vehicle IDs in Operation Plans ===\n');
    
    // ID「8」を機械番号「300」のUUIDに変換
    const machine300 = await pool.query(`
      SELECT id FROM master_data.machines WHERE machine_number = '300'
    `);
    
    if (machine300.rows.length === 0) {
      console.log('❌ Machine 300 not found!');
      await pool.end();
      return;
    }
    
    const machine300UUID = machine300.rows[0].id;
    console.log(`Machine 300 UUID: ${machine300UUID}`);
    
    // vehicle_id = '8' の運用計画を確認
    const plansToUpdate = await pool.query(`
      SELECT id, vehicle_id, plan_date, end_date
      FROM operations.operation_plans
      WHERE vehicle_id = '8'
    `);
    
    console.log(`\nFound ${plansToUpdate.rows.length} plans with vehicle_id = '8'`);
    plansToUpdate.rows.forEach(row => {
      console.log(`  Plan ${row.id}: ${row.plan_date} - ${row.end_date || 'same day'}`);
    });
    
    if (plansToUpdate.rows.length > 0) {
      console.log(`\n🔄 Updating ${plansToUpdate.rows.length} plans...`);
      
      const updateResult = await pool.query(`
        UPDATE operations.operation_plans
        SET vehicle_id = $1
        WHERE vehicle_id = '8'
      `, [machine300UUID]);
      
      console.log(`✅ Updated ${updateResult.rowCount} plans`);
      
      // 確認
      const verifyResult = await pool.query(`
        SELECT id, vehicle_id, plan_date
        FROM operations.operation_plans
        WHERE vehicle_id = $1
        ORDER BY plan_date
      `, [machine300UUID]);
      
      console.log(`\n✅ Verification: ${verifyResult.rowCount} plans now have vehicle_id = ${machine300UUID}`);
      verifyResult.rows.forEach(row => {
        console.log(`  Plan ${row.id}: ${row.plan_date}`);
      });
    } else {
      console.log('\n✅ No plans need to be updated.');
    }
    
    await pool.end();
    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrateVehicleIds();
