import db from './server/db.js';

(async () => {
  try {
    console.log('=== Checking machines and their type mappings ===\n');
    
    // machinesテーブルの機種タイプID分布を確認
    const typeDistribution = await db.query(`
      SELECT 
        m.machine_type_id,
        COUNT(*) as machine_count,
        mt.type_name,
        mt.model_name,
        mt.category
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      GROUP BY m.machine_type_id, mt.type_name, mt.model_name, mt.category
      ORDER BY machine_count DESC
    `);
    
    console.log('Machine type distribution:');
    console.log(JSON.stringify(typeDistribution.rows, null, 2));
    
    console.log('\n\n=== Sample machines with their types ===');
    const sampleMachines = await db.query(`
      SELECT 
        m.machine_number,
        m.machine_type_id,
        mt.type_name,
        mt.model_name,
        mt.category
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      ORDER BY m.machine_number
      LIMIT 10
    `);
    
    console.log(JSON.stringify(sampleMachines.rows, null, 2));
    
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
