// 検修タイプマスタにデータを挿入するスクリプト
// ブラウザのコンソールで実行してください

const inspectionTypes = [
  { type_name: '日検査', category: '定期検査', interval_days: 1, description: '日次の定期検査' },
  { type_name: '週検査', category: '定期検査', interval_days: 7, description: '週次の定期検査' },
  { type_name: '月検査', category: '定期検査', interval_days: 30, description: '月次の定期検査' },
  { type_name: '3ヶ月検査', category: '定期検査', interval_days: 90, description: '3ヶ月ごとの定期検査' },
  { type_name: '6ヶ月検査', category: '定期検査', interval_days: 180, description: '6ヶ月ごとの定期検査' },
  { type_name: '年次検査', category: '定期検査', interval_days: 365, description: '年次の定期検査' },
  { type_name: '重要部検査A', category: '重要部検査', interval_days: 730, description: '2年ごとの重要部検査A' },
  { type_name: '重要部検査B', category: '重要部検査', interval_days: 1095, description: '3年ごとの重要部検査B' },
  { type_name: '全般検査', category: '全般検査', interval_days: 1460, description: '4年ごとの全般検査' },
  { type_name: '臨時検査', category: '臨時検査', interval_days: 1, description: '故障や異常時の臨時検査' },
  { type_name: '事故後検査', category: '臨時検査', interval_days: 1, description: '事故発生後の検査' },
  { type_name: '改造工事', category: '改造', interval_days: 30, description: '車両の改造工事' },
  { type_name: '大規模修繕', category: '修繕', interval_days: 14, description: '大規模な修繕作業' },
  { type_name: '塗装工事', category: '修繕', interval_days: 7, description: '車両の塗装工事' },
  { type_name: '小修繕', category: '修繕', interval_days: 3, description: '軽微な修繕作業' },
  { type_name: '乙A検査', category: '定期検査', interval_days: 184, description: '乙A検査（184日周期）' }
];

async function insertData() {
  console.log('検修タイプマスタにデータを挿入中...');
  let successCount = 0;
  let errorCount = 0;
  
  for (const type of inspectionTypes) {
    try {
      const response = await fetch('http://localhost:3001/api/inspection-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(type)
      });
      
      if (response.ok) {
        successCount++;
        console.log(`✅ ${type.type_name} (${type.interval_days}日) を挿入しました`);
      } else {
        errorCount++;
        const error = await response.text();
        console.log(`⚠️ ${type.type_name} のエラー:`, error);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ ${type.type_name} の挿入に失敗:`, error);
    }
  }
  
  console.log(`\n=== 完了 ===`);
  console.log(`成功: ${successCount}件`);
  console.log(`エラー: ${errorCount}件`);
  console.log('\nページを再読み込みしてください。');
}

insertData();
