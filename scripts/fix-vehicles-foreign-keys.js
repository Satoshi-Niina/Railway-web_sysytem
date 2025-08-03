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

async function fixVehiclesForeignKeys() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing vehicles table foreign key constraints...');
    
    // SQLファイルを読み込み
    const sqlPath = path.join(__dirname, '27-fix-vehicles-foreign-keys.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // SQLを実行
    console.log('📋 Executing SQL script...');
    await client.query(sqlContent);
    
    console.log('✅ Vehicles table foreign key constraints fixed successfully!');
    
    // 修正後の確認
    console.log('\n📊 Verification:');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing vehicles foreign keys:', error);
    throw error;
  } finally {
    client.release();
  }
}

// スクリプト実行
fixVehiclesForeignKeys()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 