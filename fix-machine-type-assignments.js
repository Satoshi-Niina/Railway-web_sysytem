import db from './server/db.js';

(async () => {
  try {
    console.log('=== Updating machine type assignments ===\n');
    
    // 利用可能な機種タイプを取得
    const typesResult = await db.query(`
      SELECT id, type_name, model_name, category
      FROM master_data.machine_types
      ORDER BY type_name
    `);
    
    console.log('Available machine types:');
    typesResult.rows.forEach(t => {
      console.log(`  ${t.id}: ${t.type_name} - ${t.model_name} (${t.category})`);
    });
    
    // 車両番号のパターンに基づいて適切な機種タイプを割り当て
    const updates = [
      // モータカー系（300番台）
      { pattern: '^300$|^MC', typeId: 'MT0001', typeName: 'MC300' },
      
      // 鉄トロ系（TD100, TD200）
      { pattern: '^TD100', typeId: 'MT-01223084', typeName: 'MCR600' }, // 仮のマッピング
      { pattern: '^TD200', typeId: 'MT-04069065', typeName: 'MCR600' },
      
      // 箱トロ系（BOX）
      { pattern: '^BOX', typeId: 'MT-06095236', typeName: 'MCR400' },
      
      // トロリー系
      { pattern: '^TROLLEY10', typeId: 'MT-09323416', typeName: 'MCR400' },
      { pattern: '^TROLLEY25', typeId: 'MT-07360418', typeName: 'MCR400' },
      
      // ホッパー系
      { pattern: '^HOPPER', typeId: 'MT-09323416', typeName: 'MCR400' },
      
      // その他の番号
      { pattern: '^500$', typeId: 'MT-07663885', typeName: 'MC300' },
    ];
    
    console.log('\n\nUpdating machine type assignments...\n');
    
    for (const update of updates) {
      const result = await db.query(`
        UPDATE master_data.machines
        SET machine_type_id = $1
        WHERE machine_number ~ $2
        RETURNING machine_number, machine_type_id
      `, [update.typeId, update.pattern]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Updated ${result.rows.length} machines matching "${update.pattern}" to ${update.typeName} (${update.typeId})`);
        result.rows.forEach(r => {
          console.log(`   - ${r.machine_number} -> ${r.machine_type_id}`);
        });
      }
    }
    
    // 更新後の分布を確認
    console.log('\n\n=== Updated distribution ===');
    const newDistribution = await db.query(`
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
    
    console.log(JSON.stringify(newDistribution.rows, null, 2));
    
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await db.end();
    process.exit(1);
  }
})();
