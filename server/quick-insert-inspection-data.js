import pool from './db.js';

async function insertInspectionTypesData() {
  const client = await pool.connect();
  try {
    console.log('検修タイプマスタにサンプルデータを挿入中...\n');
    
    // 既存データを確認
    const checkResult = await client.query('SELECT COUNT(*) as count FROM master_data.inspection_types');
    console.log(`現在のレコード数: ${checkResult.rows[0].count}件\n`);
    
    // サンプルデータを挿入
    const insertQuery = `
      INSERT INTO master_data.inspection_types (type_name, category, interval_days, description) 
      VALUES
        ('日検査', '定期検査', 1, '日次の定期検査'),
        ('週検査', '定期検査', 7, '週次の定期検査'),
        ('月検査', '定期検査', 30, '月次の定期検査'),
        ('3ヶ月検査', '定期検査', 90, '3ヶ月ごとの定期検査'),
        ('6ヶ月検査', '定期検査', 180, '6ヶ月ごとの定期検査'),
        ('年次検査', '定期検査', 365, '年次の定期検査'),
        ('重要部検査A', '重要部検査', 730, '2年ごとの重要部検査A'),
        ('重要部検査B', '重要部検査', 1095, '3年ごとの重要部検査B'),
        ('全般検査', '全般検査', 1460, '4年ごとの全般検査'),
        ('臨時検査', '臨時検査', 1, '故障や異常時の臨時検査'),
        ('事故後検査', '臨時検査', 1, '事故発生後の検査'),
        ('改造工事', '改造', 30, '車両の改造工事'),
        ('大規模修繕', '修繕', 14, '大規模な修繕作業'),
        ('塗装工事', '修繕', 7, '車両の塗装工事'),
        ('小修繕', '修繕', 3, '軽微な修繕作業'),
        ('乙A検査', '定期検査', 184, '乙A検査（184日周期）')
      ON CONFLICT DO NOTHING
      RETURNING id, type_name, interval_days;
    `;
    
    const result = await client.query(insertQuery);
    console.log(`✅ ${result.rowCount}件のデータを挿入しました\n`);
    
    // 挿入されたデータを確認
    const selectResult = await client.query(`
      SELECT 
        id,
        type_name,
        category,
        interval_days,
        type_name || '・' || interval_days || '日' as display_name
      FROM master_data.inspection_types 
      ORDER BY category, interval_days
    `);
    
    console.log('=== 検修タイプマスタの全データ ===');
    console.table(selectResult.rows);
    
    console.log('\n✅ データ挿入が完了しました。ブラウザを再読み込みしてください。');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

insertInspectionTypesData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('処理が失敗しました:', error);
    process.exit(1);
  });
