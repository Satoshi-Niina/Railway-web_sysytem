import db from './server/db.js';

(async () => {
  try {
    console.log('=== Checking machine_types table in detail ===\n');
    
    // すべてのmachine_typesを取得
    const allTypes = await db.query(`
      SELECT id, type_code, type_name, model_name, category, manufacturer
      FROM master_data.machine_types
      ORDER BY id
    `);
    
    console.log(`Total machine_types records: ${allTypes.rows.length}\n`);
    
    // idとtype_codeの重複をチェック
    const duplicates = allTypes.rows.filter(row => row.id === row.type_code);
    console.log(`Records where id === type_code: ${duplicates.length}`);
    if (duplicates.length > 0) {
      console.log('Sample duplicates:');
      console.log(JSON.stringify(duplicates.slice(0, 3), null, 2));
    }
    
    // machinesテーブルで使われているmachine_type_idを確認
    const usedTypeIds = await db.query(`
      SELECT DISTINCT machine_type_id, COUNT(*) as usage_count
      FROM master_data.machines
      GROUP BY machine_type_id
      ORDER BY machine_type_id
    `);
    
    console.log('\n\nMachine type IDs used in machines table:');
    console.log(JSON.stringify(usedTypeIds.rows, null, 2));
    
    // machine_typesテーブルに存在するかチェック
    console.log('\n\nChecking if used type IDs exist in machine_types:');
    for (const row of usedTypeIds.rows) {
      const exists = await db.query(`
        SELECT id, type_code, type_name, model_name
        FROM master_data.machine_types
        WHERE id = $1
      `, [row.machine_type_id]);
      
      if (exists.rows.length === 0) {
        console.log(`❌ Missing: ${row.machine_type_id} (used by ${row.usage_count} machines)`);
      } else {
        console.log(`✅ Found: ${row.machine_type_id} -> ${exists.rows[0].model_name || exists.rows[0].type_name}`);
      }
    }
    
    // 提案: type_codeをユニークなコードに、idは主キーとして分離する
    console.log('\n\n=== Recommendations ===');
    console.log('1. id should be the primary key (unique identifier)');
    console.log('2. type_code should be a separate business/display code');
    console.log('3. Consider running a migration to fix data structure');
    
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
