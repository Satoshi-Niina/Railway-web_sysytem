import db from './server/db.js';

(async () => {
  try {
    console.log('=== 機種データの確認 ===\n');
    
    // すべてのmachine_typesを取得
    const allTypes = await db.query(`
      SELECT id, type_name, model_name, category, manufacturer
      FROM master_data.machine_types
      ORDER BY model_name
    `);
    
    console.log(`machine_types総数: ${allTypes.rows.length}\n`);
    
    console.log('全機種リスト:');
    allTypes.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ID:${row.id}, model_name: "${row.model_name || '(null)'}", type_name: "${row.type_name || '(null)'}"`);
    });
    
    // machinesテーブルでの使用状況
    console.log('\n\n=== 機械との紐付け状況 ===\n');
    const machinesByType = await db.query(`
      SELECT 
        mt.model_name,
        COUNT(m.id) as machine_count,
        mo.office_name,
        COUNT(DISTINCT mo.office_id) as office_count
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LEFT JOIN master_data.managements_offices mo ON m.office_id::text = mo.office_id::text
      GROUP BY mt.model_name, mo.office_name
      ORDER BY mt.model_name, mo.office_name
    `);
    
    console.log('機種ごとの機械台数（事業所別）:');
    machinesByType.rows.forEach(row => {
      console.log(`  ${row.model_name || '(null)'}: ${row.machine_count}台 - ${row.office_name || '(未割当)'}`);
    });
    
    // ユニークな機種数を確認
    const uniqueModelNames = await db.query(`
      SELECT DISTINCT mt.model_name, COUNT(m.id) as total_machines
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      GROUP BY mt.model_name
      ORDER BY mt.model_name
    `);
    
    console.log('\n\n=== ユニークな機種数 ===');
    console.log(`合計: ${uniqueModelNames.rows.length}機種\n`);
    uniqueModelNames.rows.forEach(row => {
      console.log(`  ${row.model_name || '(null)'}: ${row.total_machines}台`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
