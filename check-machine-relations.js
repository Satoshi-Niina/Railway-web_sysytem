import db from './server/db.js';

async function checkMachineRelations() {
  try {
    console.log('=== データベース構造確認 ===\n');

    // 1. machine_types テーブルの構造と内容を確認
    console.log('1. machine_types テーブル:');
    const machineTypesResult = await db.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'master_data' 
        AND table_name = 'machine_types'
      ORDER BY ordinal_position
    `);
    console.log('カラム構造:', machineTypesResult.rows);

    const mtData = await db.query(`
      SELECT id, type_code, type_name, model_name, category, manufacturer
      FROM master_data.machine_types
      ORDER BY type_code
      LIMIT 5
    `);
    console.log('\n機種データ（最初の5件）:', mtData.rows);
    console.log(`\n総機種数: ${(await db.query('SELECT COUNT(*) as count FROM master_data.machine_types')).rows[0].count} 件\n`);

    // 2. machines テーブ��の構造と内容を確認
    console.log('2. machines テーブル:');
    const machinesResult = await db.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'master_data' 
        AND table_name = 'machines'
      ORDER BY ordinal_position
    `);
    console.log('カラム構造:', machinesResult.rows);

    const machinesData = await db.query(`
      SELECT id, machine_number, machine_type_id, serial_number, office_id
      FROM master_data.machines
      ORDER BY machine_number
      LIMIT 5
    `);
    console.log('\n機械データ（最初の5件）:', machinesData.rows);
    console.log(`\n総機械数: ${(await db.query('SELECT COUNT(*) as count FROM master_data.machines')).rows[0].count} 件\n`);

    // 3. machines と machine_types のリレーションを確認
    console.log('3. machines と machine_types のリレーション確認:');
    const relationCheck = await db.query(`
      SELECT 
        m.id,
        m.machine_number,
        m.machine_type_id,
        mt.type_code,
        mt.type_name,
        mt.model_name,
        mt.category
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      ORDER BY m.machine_number
      LIMIT 10
    `);
    console.log('JOIN結果（最初の10件）:', relationCheck.rows);

    // 4. 外部キー制約を確認
    console.log('\n4. 外部キー制約:');
    const fkCheck = await db.query(`
      SELECT
        tc.constraint_name,
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'master_data'
        AND tc.table_name IN ('machines', 'machine_types')
    `);
    console.log('外部キー制約:', fkCheck.rows);

    // 5. 事業所テーブルとのリレーションを確認
    console.log('\n5. 事業所テーブルとのリレーション:');
    const officeRelation = await db.query(`
      SELECT 
        m.id,
        m.machine_number,
        m.office_id,
        o.office_name,
        mt.model_name
      FROM master_data.machines m
      LEFT JOIN master_data.managements_offices o ON m.office_id::integer = o.office_id
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      ORDER BY m.machine_number
      LIMIT 10
    `);
    console.log('事業所リレーション（最初の10件）:', officeRelation.rows);

    // 6. app_resource_routing テーブルを確認
    console.log('\n6. app_resource_routing設定:');
    const routingData = await db.query(`
      SELECT 
        app_id,
        logical_resource_name,
        physical_schema,
        physical_table,
        is_active
      FROM public.app_resource_routing
      WHERE logical_resource_name IN ('machines', 'machine_types', 'managements_offices')
      ORDER BY app_id, logical_resource_name
    `);
    console.log('ルーティング設定:', routingData.rows);

    // 7. 事業所データを確認
    console.log('\n7. 事業所データ:');
    const officesData = await db.query(`
      SELECT office_id, office_name, created_at
      FROM master_data.managements_offices
      ORDER BY office_id
      LIMIT 10
    `);
    console.log('事業所データ（最初の10件）:', officesData.rows);
    console.log(`\n総事業所数: ${(await db.query('SELECT COUNT(*) as count FROM master_data.managements_offices')).rows[0].count} 件\n`);

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await db.end();
  }
}

checkMachineRelations();
