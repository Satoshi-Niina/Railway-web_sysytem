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

async function checkDatabaseStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database structure...\n');
    
    // 1. テーブル一覧を取得
    console.log('📋 Tables in database:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    tablesResult.rows.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    // 2. 各テーブルの構造を確認
    console.log('\n🔧 Table structures:');
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`\n📊 ${tableName}:`);
      
      // カラム情報を取得
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);
      
      columnsResult.rows.forEach(column => {
        const nullable = column.is_nullable === 'YES' ? 'nullable' : 'NOT NULL';
        const defaultValue = column.column_default ? ` [default: ${column.column_default}]` : '';
        console.log(`  - ${column.column_name}: ${column.data_type} (${nullable})${defaultValue}`);
      });
      
      // 外部キー制約を取得
      const foreignKeysResult = await client.query(`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = $1
      `, [tableName]);
      
      if (foreignKeysResult.rows.length > 0) {
        console.log(`  🔗 Foreign keys:`);
        foreignKeysResult.rows.forEach(fk => {
          console.log(`    - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
      
      // データ件数を確認
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`  📈 Row count: ${countResult.rows[0].count}`);
    }
    
    // 3. 特定のテーブルの詳細確認
    console.log('\n🔍 Detailed analysis of key tables:');
    
    // management_offices テーブル
    console.log('\n📋 management_offices:');
    const officesResult = await client.query('SELECT * FROM management_offices ORDER BY id LIMIT 3');
    console.log('Sample data:', officesResult.rows);
    
    // bases テーブル
    console.log('\n📋 bases:');
    const basesResult = await client.query('SELECT * FROM bases ORDER BY id LIMIT 3');
    console.log('Sample data:', basesResult.rows);
    
    // vehicles テーブル
    console.log('\n📋 vehicles:');
    const vehiclesResult = await client.query('SELECT * FROM vehicles ORDER BY id LIMIT 3');
    console.log('Sample data:', vehiclesResult.rows);
    
    // 4. リレーションの整合性チェック
    console.log('\n🔗 Relationship integrity check:');
    
    // vehicles -> management_offices
    const vehicleOfficeCheck = await client.query(`
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(CASE WHEN mo.id IS NULL THEN 1 END) as orphaned_vehicles
      FROM vehicles v
      LEFT JOIN management_offices mo ON v.management_office_id = mo.id
      WHERE v.status = 'active'
    `);
    console.log(`Vehicles -> Management Offices: ${vehicleOfficeCheck.rows[0].total_vehicles} total, ${vehicleOfficeCheck.rows[0].orphaned_vehicles} orphaned`);
    
    // vehicles -> bases
    const vehicleBaseCheck = await client.query(`
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(CASE WHEN b.id IS NULL THEN 1 END) as orphaned_vehicles
      FROM vehicles v
      LEFT JOIN bases b ON v.home_base_id = b.id
      WHERE v.status = 'active'
    `);
    console.log(`Vehicles -> Bases: ${vehicleBaseCheck.rows[0].total_vehicles} total, ${vehicleBaseCheck.rows[0].orphaned_vehicles} orphaned`);
    
    // bases -> management_offices
    const baseOfficeCheck = await client.query(`
      SELECT 
        COUNT(*) as total_bases,
        COUNT(CASE WHEN mo.id IS NULL THEN 1 END) as orphaned_bases
      FROM bases b
      LEFT JOIN management_offices mo ON b.management_office_id = mo.id
    `);
    console.log(`Bases -> Management Offices: ${baseOfficeCheck.rows[0].total_bases} total, ${baseOfficeCheck.rows[0].orphaned_bases} orphaned`);
    
  } catch (error) {
    console.error('❌ Error checking database structure:', error);
    throw error;
  } finally {
    client.release();
  }
}

// スクリプト実行
checkDatabaseStructure()
  .then(() => {
    console.log('\n🎉 Database structure check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database structure check failed:', error);
    process.exit(1);
  }); 