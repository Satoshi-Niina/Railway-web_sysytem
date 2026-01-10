import db from './server/db.js';

(async () => {
  try {
    console.log('=== Checking machine_types table schema ===');
    
    // テーブルのカラム構造を確認
    const schemaResult = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'master_data' 
        AND table_name = 'machine_types'
      ORDER BY ordinal_position
    `);
    
    console.log('\nColumns in master_data.machine_types:');
    console.log(JSON.stringify(schemaResult.rows, null, 2));
    
    // 実際のデータを確認
    const dataResult = await db.query(`
      SELECT * FROM master_data.machine_types LIMIT 5
    `);
    
    console.log('\nSample data from machine_types:');
    console.log(JSON.stringify(dataResult.rows, null, 2));
    
    // machinesテーブルも確認
    const machinesSchema = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'master_data' 
        AND table_name = 'machines'
      ORDER BY ordinal_position
    `);
    
    console.log('\n\nColumns in master_data.machines:');
    console.log(JSON.stringify(machinesSchema.rows, null, 2));
    
    // JOINしたクエリの結果を確認
    const joinResult = await db.query(`
      SELECT 
        m.id,
        m.machine_number,
        m.machine_type_id,
        mt.type_code,
        mt.type_name,
        mt.model_name,
        mt.category as machine_type,
        m.office_id,
        o.office_name
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LEFT JOIN master_data.managements_offices o ON m.office_id::integer = o.office_id
      LIMIT 5
    `);
    
    console.log('\n\nJOIN query result:');
    console.log(JSON.stringify(joinResult.rows, null, 2));
    
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
