import db from './server/db.js';

(async () => {
  try {
    console.log('=== Removing type_code column from machine_types ===\n');
    
    // 現在の構造を確認
    const currentStructure = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'master_data' 
        AND table_name = 'machine_types'
      ORDER BY ordinal_position
    `);
    
    console.log('Current machine_types structure:');
    currentStructure.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // type_codeカラムが存在するか確認
    const hasTypeCode = currentStructure.rows.some(col => col.column_name === 'type_code');
    
    if (hasTypeCode) {
      console.log('\n✅ type_code column exists, removing it...');
      
      // type_codeカラムを削除
      await db.query(`
        ALTER TABLE master_data.machine_types 
        DROP COLUMN IF EXISTS type_code
      `);
      
      console.log('✅ type_code column removed successfully');
      
      // 更新後の構造を確認
      const updatedStructure = await db.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'master_data' 
          AND table_name = 'machine_types'
        ORDER BY ordinal_position
      `);
      
      console.log('\nUpdated machine_types structure:');
      updatedStructure.rows.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('\n⚠️ type_code column does not exist');
    }
    
    // サンプルデータを表示
    console.log('\n\nSample machine_types data (after removal):');
    const sampleData = await db.query(`
      SELECT id, type_name, model_name, manufacturer, category
      FROM master_data.machine_types
      LIMIT 5
    `);
    console.log(JSON.stringify(sampleData.rows, null, 2));
    
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await db.end();
    process.exit(1);
  }
})();
