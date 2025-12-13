import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/webappdb'
});

async function checkSchema() {
  try {
    console.log('=== データベーススキーマ確認 ===\n');
    
    // 全スキーマの確認
    console.log('【利用可能なスキーマ】');
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schema_name
    `);
    console.log(schemasResult.rows.map(r => r.schema_name).join(', '));
    
    // 全テーブルの確認
    console.log('\n【全テーブル一覧】');
    const tablesResult = await pool.query(`
      SELECT table_schema, table_name, 
             (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);
    
    const tablesBySchema = {};
    tablesResult.rows.forEach(row => {
      if (!tablesBySchema[row.table_schema]) {
        tablesBySchema[row.table_schema] = [];
      }
      tablesBySchema[row.table_schema].push(`${row.table_name} (${row.column_count}列)`);
    });
    
    for (const [schema, tables] of Object.entries(tablesBySchema)) {
      console.log(`\n${schema}:`);
      tables.forEach(table => {
        console.log(`  - ${table}`);
      });
    }
    
    // operation_plansテーブルの検索
    console.log('\n【operation_plans テーブルの検索】');
    const opPlansResult = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%operation%plan%'
    `);
    
    if (opPlansResult.rows.length > 0) {
      console.log('見つかりました:');
      opPlansResult.rows.forEach(row => {
        console.log(`  - ${row.table_schema}.${row.table_name}`);
      });
    } else {
      console.log('⚠️ operation_plans テーブルが見つかりません');
    }
    
  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
