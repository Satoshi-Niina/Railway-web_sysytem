const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'webappdb',
  user: 'postgres',
  password: 'postgres'
});

async function setupInspectionMaster() {
  const client = await pool.connect();
  
  try {
    console.log('=== 検修マスタの設定を開始 ===\n');

    // 1. interval_monthsカラムを追加
    console.log('1. interval_monthsカラムを追加...');
    await client.query(`
      ALTER TABLE master_data.inspection_types 
      ADD COLUMN IF NOT EXISTS interval_months INTEGER
    `);
    console.log('✅ interval_monthsカラムを追加しました\n');

    // 2. duration_daysカラムを追加（期間（日））
    console.log('2. duration_daysカラムを追加...');
    await client.query(`
      ALTER TABLE master_data.inspection_types 
      ADD COLUMN IF NOT EXISTS duration_days INTEGER
    `);
    console.log('✅ duration_daysカラムを追加しました\n');

    // 3. 既存のinterval_daysデータがあれば、interval_monthsに変換
    console.log('3. 既存データをチェック...');
    const existing = await client.query(`
      SELECT id, type_name, interval_days 
      FROM master_data.inspection_types 
      WHERE interval_days IS NOT NULL AND interval_months IS NULL
    `);
    
    if (existing.rowCount > 0) {
      console.log(`  ${existing.rowCount}件の既存データを変換します...`);
      for (const row of existing.rows) {
        const months = Math.round(row.interval_days / 30);
        await client.query(`
          UPDATE master_data.inspection_types 
          SET interval_months = $1 
          WHERE id = $2
        `, [months, row.id]);
        console.log(`  - ${row.type_name}: ${row.interval_days}日 → ${months}ヶ月`);
      }
    }
    console.log('✅ データ変換完了\n');

    // 4. サンプルデータを挿入
    console.log('4. サンプルデータを挿入...');
    const insertResult = await client.query(`
      INSERT INTO master_data.inspection_types (type_name, category, interval_months, duration_days, description)
      VALUES 
        ('乙A検査', '定期検査', 6, 7, '乙A検査（6ヶ月周期・7日間）'),
        ('月検査', '定期検査', 1, 1, '月次の定期検査（1ヶ月周期・1日間）'),
        ('年検査', '定期検査', 12, 10, '年次の定期検査（12ヶ月周期・10日間）')
      ON CONFLICT DO NOTHING
      RETURNING *
    `);
    
    if (insertResult.rowCount > 0) {
      console.log(`✅ ${insertResult.rowCount}件のデータを挿入しました`);
      insertResult.rows.forEach(row => {
        console.log(`  - ${row.type_name}: 周期${row.interval_months}ヶ月 / 期間${row.duration_days}日`);
      });
    } else {
      console.log('⚠️ データは既に存在します');
    }
    console.log('');

    // 5. 最終確認
    console.log('5. テーブル構造を確認...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'master_data' 
        AND table_name = 'inspection_types'
      ORDER BY ordinal_position
    `);
    
    console.log('カラム一覧:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // 6. 現在のデータを表示
    console.log('6. 現在のデータ:');
    const data = await client.query(`
      SELECT id, type_name, category, interval_months, duration_days, description 
      FROM master_data.inspection_types 
      ORDER BY interval_months
    `);
    
    console.log(`登録件数: ${data.rowCount}件`);
    data.rows.forEach(row => {
      console.log(`  ${row.id}. ${row.type_name} (${row.category})`);
      console.log(`     周期: ${row.interval_months}ヶ月 / 期間: ${row.duration_days}日`);
      console.log(`     説明: ${row.description}`);
    });

    console.log('\n=== セットアップ完了 ===');

  } catch (error) {
    console.error('\n❌ エラー発生:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupInspectionMaster();
