import db from './server/db.js';

(async () => {
  try {
    console.log('=== Fixing invalid machine type IDs ===\n');
    
    // 存在しない機種タイプIDを持つ車両を確認
    const invalidMachines = await db.query(`
      SELECT m.machine_number, m.machine_type_id
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      WHERE mt.id IS NULL
    `);
    
    if (invalidMachines.rows.length > 0) {
      console.log('Machines with invalid type IDs:');
      invalidMachines.rows.forEach(m => {
        console.log(`  ${m.machine_number}: ${m.machine_type_id} (not found in machine_types)`);
      });
      
      // MT-09323416 と MT-07360418 が存在しないので、MT-09232416 (MCR400) に修正
      console.log('\nFixing invalid IDs to use MT-09232416 (MCR400 - 400RB)...');
      
      const fix1 = await db.query(`
        UPDATE master_data.machines
        SET machine_type_id = 'MT-09232416'
        WHERE machine_type_id = 'MT-09323416'
        RETURNING machine_number
      `);
      console.log(`✅ Fixed ${fix1.rows.length} machines (MT-09323416 -> MT-09232416)`);
      
      const fix2 = await db.query(`
        UPDATE master_data.machines
        SET machine_type_id = 'MT-07369418'
        WHERE machine_type_id = 'MT-07360418'
        RETURNING machine_number
      `);
      console.log(`✅ Fixed ${fix2.rows.length} machines (MT-07360418 -> MT-07369418)`);
    }
    
    // 最終的な分布を確認
    console.log('\n=== Final distribution ===');
    const finalDistribution = await db.query(`
      SELECT 
        m.machine_type_id,
        COUNT(*) as machine_count,
        mt.type_name,
        mt.model_name,
        mt.category,
        STRING_AGG(m.machine_number, ', ' ORDER BY m.machine_number) as machines
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      GROUP BY m.machine_type_id, mt.type_name, mt.model_name, mt.category
      ORDER BY mt.model_name, machine_count DESC
    `);
    
    console.log('\n');
    finalDistribution.rows.forEach(row => {
      console.log(`${row.model_name || 'Unknown'} (${row.category || 'N/A'}): ${row.machine_count} machines`);
      console.log(`  Machines: ${row.machines}`);
      console.log('');
    });
    
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await db.end();
    process.exit(1);
  }
})();
