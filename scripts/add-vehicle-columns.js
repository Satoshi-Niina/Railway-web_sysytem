const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 環境変数からデータベース接続情報を取得
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL or POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function addVehicleColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding columns to vehicles table...');
    
    // SQLファイルを読み込み
    const sqlPath = path.join(__dirname, '28-add-vehicle-columns.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // SQLを実行
    console.log('📋 Executing SQL script...');
    await client.query(sqlContent);
    
    console.log('✅ Vehicle columns added successfully!');
    
    // 修正後の確認
    console.log('\n📊 Verification:');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})${row.column_default ? ` [default: ${row.column_default}]` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding vehicle columns:', error);
    throw error;
  } finally {
    client.release();
  }
}

// スクリプト実行
addVehicleColumns()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 