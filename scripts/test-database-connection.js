const { Pool } = require('pg');

// データベース接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/railway_maintenance',
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function testDatabaseConnection() {
  console.log('🔍 データベース接続をテスト中...');
  
  try {
    // 接続テスト
    const client = await pool.connect();
    console.log('✅ データベース接続成功');
    
    // テーブル一覧を取得
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 データベース内のテーブル:');
    if (tablesResult.rows.length === 0) {
      console.log('   - テーブルが見つかりません');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // 重要なテーブルの存在確認
    const importantTables = ['management_offices', 'maintenance_bases', 'vehicles', 'operation_plans'];
    console.log('\n🔍 重要なテーブルの確認:');
    
    for (const tableName of importantTables) {
      const exists = tablesResult.rows.some(row => row.table_name === tableName);
      if (exists) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
          console.log(`   ✅ ${tableName}: ${countResult.rows[0].count} 件`);
          
          // データの内容も確認
          if (countResult.rows[0].count > 0) {
            const dataResult = await client.query(`SELECT * FROM ${tableName} LIMIT 3`);
            console.log(`     サンプルデータ:`, dataResult.rows);
          }
        } catch (error) {
          console.log(`   ❌ ${tableName}: エラー (${error.message})`);
        }
      } else {
        console.log(`   ❌ ${tableName}: テーブルが存在しません`);
      }
    }
    
    // 各テーブルのレコード数を確認
    if (tablesResult.rows.length > 0) {
      console.log('\n📊 各テーブルのレコード数:');
      for (const table of tablesResult.rows) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
          console.log(`   - ${table.table_name}: ${countResult.rows[0].count} 件`);
        } catch (error) {
          console.log(`   - ${table.table_name}: エラー (${error.message})`);
        }
      }
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ データベース接続エラー:', error.message);
    console.log('\n💡 解決方法:');
    console.log('1. PostgreSQLが起動しているか確認してください');
    console.log('2. データベース "railway_maintenance" が存在するか確認してください');
    console.log('3. 環境変数 DATABASE_URL が正しく設定されているか確認してください');
    console.log('4. ユーザー名とパスワードが正しいか確認してください');
  } finally {
    await pool.end();
  }
}

// スクリプト実行
testDatabaseConnection(); 