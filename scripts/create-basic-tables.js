const { Pool } = require('pg');

// データベース接続設定
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/railway_maintenance',
  ssl: false,
});

async function createBasicTables() {
  console.log('🚀 Creating basic tables...');
  
  try {
    const client = await pool.connect();
    
    // 1. 管理事業所テーブル
    console.log('Creating management_offices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS management_offices (
        id SERIAL PRIMARY KEY,
        office_name VARCHAR(100) NOT NULL,
        office_code VARCHAR(20),
        location VARCHAR(100),
        responsible_area TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. 保守基地テーブル
    console.log('Creating maintenance_bases table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance_bases (
        id SERIAL PRIMARY KEY,
        base_name VARCHAR(100) NOT NULL,
        base_type VARCHAR(50) DEFAULT 'maintenance',
        location VARCHAR(100),
        management_office_id INTEGER REFERENCES management_offices(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 3. 車両テーブル
    console.log('Creating vehicles table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        machine_number VARCHAR(50) NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL,
        model VARCHAR(100),
        manufacturer VARCHAR(100),
        acquisition_date DATE,
        management_office_id INTEGER REFERENCES management_offices(id),
        home_base_id INTEGER,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 4. 運用計画テーブル
    console.log('Creating operation_plans table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS operation_plans (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER REFERENCES vehicles(id),
        plan_date DATE NOT NULL,
        shift_type VARCHAR(20) NOT NULL,
        start_time TIME,
        end_time TIME,
        planned_distance INTEGER,
        departure_base_id INTEGER,
        arrival_base_id INTEGER,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'planned',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 5. サンプルデータの挿入
    console.log('Inserting sample data...');
    
    // 管理事業所データ
    await client.query(`
      INSERT INTO management_offices (office_name, office_code, location, responsible_area) VALUES
      ('本社保守事業所', 'HQ001', '東京', '関東地区'),
      ('関西支社保守事業所', 'KS001', '大阪', '関西地区'),
      ('福山保線作業所', 'FK001', '広島県福山市', '中国地区')
      ON CONFLICT (id) DO NOTHING
    `);
    
    // 保守基地データ
    await client.query(`
      INSERT INTO maintenance_bases (base_name, base_type, location, management_office_id) VALUES
      ('本社保守基地', 'maintenance', '東京', 1),
      ('関西保守基地', 'maintenance', '大阪', 2),
      ('東福山保守基地', 'maintenance', '広島県福山市', 3)
      ON CONFLICT (id) DO NOTHING
    `);
    
    // 車両データ
    await client.query(`
      INSERT INTO vehicles (machine_number, vehicle_type, model, manufacturer, acquisition_date, management_office_id, home_base_id) VALUES
      ('M001', 'モータカー', 'MC-100', 'メーカーA', '2020-04-01', 1, 1),
      ('M002', 'MCR', 'MCR-200', 'メーカーB', '2020-05-01', 1, 1),
      ('M003', '鉄トロ（10t）', 'TT-10', 'メーカーC', '2019-06-01', 2, 2)
      ON CONFLICT (id) DO NOTHING
    `);
    
    // 運用計画データ
    await client.query(`
      INSERT INTO operation_plans (vehicle_id, plan_date, shift_type, start_time, end_time, planned_distance, departure_base_id, arrival_base_id, notes) VALUES
      (1, '2024-01-01', 'day', '08:00', '17:00', 50, 1, 1, '通常運用'),
      (1, '2024-01-02', 'night', '20:00', '05:00', 80, 1, 2, '夜間運用（本社→関西）'),
      (2, '2024-01-01', 'day', '08:00', '17:00', 60, 2, 2, '関西地区運用')
      ON CONFLICT (id) DO NOTHING
    `);
    
    client.release();
    console.log('✅ Basic tables created successfully');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  }
}

// データベースの状態を確認
async function checkDatabase() {
  console.log('\n🔍 Checking database status...');
  
  try {
    const client = await pool.connect();
    
    // テーブル一覧を取得
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // 各テーブルのレコード数を確認
    console.log('\n📊 Record counts:');
    for (const table of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
        console.log(`   - ${table.table_name}: ${countResult.rows[0].count} records`);
      } catch (error) {
        console.log(`   - ${table.table_name}: Error (${error.message})`);
      }
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

// メイン実行
async function main() {
  await createBasicTables();
  await checkDatabase();
  await pool.end();
  console.log('\n✅ Database setup completed');
}

main().catch(console.error); 