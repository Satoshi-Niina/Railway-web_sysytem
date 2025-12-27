import pool from './db.js';

async function insertInspectionTypesDirectly() {
  try {
    console.log('検修タイプマスタにサンプルデータを挿入中...');
    
    const insertQuery = `
      INSERT INTO master_data.inspection_types (type_name, category, interval_days, description) VALUES
      ('月検査', '定期検査', 30, '月次の定期検査'),
      ('3ヶ月検査', '定期検査', 90, '3ヶ月ごとの定期検査'),
      ('6ヶ月検査', '定期検査', 180, '6ヶ月ごとの定期検査'),
      ('年次検査', '定期検査', 365, '年次の定期検査'),
      ('重要部検査A', '重要部検査', 730, '2年ごとの重要部検査A'),
      ('重要部検査B', '重要部検査', 1095, '3年ごとの重要部検査B'),
      ('全般検査', '全般検査', 1460, '4年ごとの全般検査'),
      ('臨時検査', '臨時検査', NULL, '故障や異常時の臨時検査'),
      ('事故後検査', '臨時検査', NULL, '事故発生後の検査'),
      ('改造工事', '改造', NULL, '車両の改造工事'),
      ('大規模修繕', '修繕', NULL, '大規模な修繕作業'),
      ('塗装工事', '修繕', NULL, '車両の塗装工事')
      ON CONFLICT DO NOTHING
    `;
    
    await pool.query(insertQuery);
    
    console.log('✅ 検修タイプマスタの挿入が完了しました');
    
    // 挿入されたデータを確認
    const result = await pool.query('SELECT * FROM master_data.inspection_types ORDER BY category, type_name');
    console.log('\n挿入されたデータ:');
    console.table(result.rows);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    await pool.end();
    process.exit(1);
  }
}

insertInspectionTypesDirectly();
