import db from '../server/db.js';

/**
 * machine_typesテーブルの構造を変更
 * 
 * 変更内容:
 * 1. type_nameカラムを削除（model_nameを使用）
 * 2. type_codeカラムを削除（idのみ使用）
 * 3. categoryを正規化（軌道モータカー、箱トロ、鉄トロ等）
 */

async function migrateMachineTypesStructure() {
  try {
    console.log('=== Machine Types Structure Migration ===\n');
    
    // 1. 現在のデータを確認
    console.log('Step 1: Checking current data...');
    const currentData = await db.query(`
      SELECT id, type_code, type_name, model_name, category, manufacturer
      FROM master_data.machine_types
      ORDER BY id
    `);
    console.log(`Found ${currentData.rows.length} machine types\n`);
    console.log('Sample data (first 3):');
    console.log(JSON.stringify(currentData.rows.slice(0, 3), null, 2));
    
    // 2. データの移行準備（type_nameのデータをmodel_nameに統合）
    console.log('\n\nStep 2: Preparing data migration...');
    const updates = [];
    for (const row of currentData.rows) {
      if (!row.model_name && row.type_name) {
        // model_nameが空でtype_nameがある場合、type_nameをmodel_nameに移行
        updates.push({
          id: row.id,
          oldModelName: row.model_name,
          newModelName: row.type_name
        });
      }
    }
    
    if (updates.length > 0) {
      console.log(`Will update ${updates.length} records to move type_name to model_name:`);
      updates.forEach(u => console.log(`  - ${u.id}: "${u.oldModelName}" -> "${u.newModelName}"`));
      
      console.log('\nUpdating model_name values...');
      for (const update of updates) {
        await db.query(`
          UPDATE master_data.machine_types
          SET model_name = $1
          WHERE id = $2
        `, [update.newModelName, update.id]);
      }
      console.log('✅ Model names updated');
    } else {
      console.log('No updates needed for model_name');
    }
    
    // 3. categoryの正規化（オプション：既存のカテゴリを確認）
    console.log('\n\nStep 3: Checking category values...');
    const categories = await db.query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM master_data.machine_types
      GROUP BY category
      ORDER BY category
    `);
    console.log('Current categories:');
    categories.rows.forEach(cat => {
      console.log(`  - ${cat.category || '(null)'}: ${cat.count} records`);
    });
    
    // 4. バックアップテーブルを作成
    console.log('\n\nStep 4: Creating backup...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS master_data.machine_types_backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')} AS
      SELECT * FROM master_data.machine_types
    `);
    console.log('✅ Backup created');
    
    // 5. type_codeカラムを削除
    console.log('\n\nStep 5: Dropping type_code column...');
    try {
      await db.query(`
        ALTER TABLE master_data.machine_types
        DROP COLUMN IF EXISTS type_code
      `);
      console.log('✅ type_code column dropped');
    } catch (error) {
      console.log('⚠️  type_code column might not exist or already dropped');
    }
    
    // 6. type_nameカラムを削除
    console.log('\n\nStep 6: Dropping type_name column...');
    try {
      await db.query(`
        ALTER TABLE master_data.machine_types
        DROP COLUMN IF EXISTS type_name
      `);
      console.log('✅ type_name column dropped');
    } catch (error) {
      console.log('⚠️  type_name column might not exist or already dropped');
    }
    
    // 7. model_nameをNOT NULLに変更
    console.log('\n\nStep 7: Making model_name NOT NULL...');
    await db.query(`
      ALTER TABLE master_data.machine_types
      ALTER COLUMN model_name SET NOT NULL
    `);
    console.log('✅ model_name is now NOT NULL');
    
    // 8. 最終的なテーブル構造を確認
    console.log('\n\nStep 8: Verifying new structure...');
    const finalStructure = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'master_data'
        AND table_name = 'machine_types'
      ORDER BY ordinal_position
    `);
    console.log('\nFinal table structure:');
    console.log(JSON.stringify(finalStructure.rows, null, 2));
    
    // 9. 最終データを確認
    console.log('\n\nStep 9: Checking migrated data...');
    const finalData = await db.query(`
      SELECT id, model_name, category, manufacturer
      FROM master_data.machine_types
      ORDER BY id
      LIMIT 5
    `);
    console.log('Sample migrated data:');
    console.log(JSON.stringify(finalData.rows, null, 2));
    
    console.log('\n\n=== Migration Completed Successfully ===');
    console.log('\nNext steps:');
    console.log('1. Update API endpoints to use model_name instead of type_name');
    console.log('2. Update UI components to reference model_name');
    console.log('3. Test all functionality');
    
    await db.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\n\nTo rollback, you can restore from the backup table:');
    console.log('SELECT * FROM master_data.machine_types_backup_YYYYMMDD;');
    
    await db.end();
    process.exit(1);
  }
}

// 実行
migrateMachineTypesStructure();
