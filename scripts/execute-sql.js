const { Pool } = require('pg');
const fs = require('fs');

// データベース接続設定
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/railway_maintenance',
  ssl: false,
});

async function executeSQLFile(filename) {
  console.log(`Executing SQL file: ${filename}`);
  
  try {
    const sqlContent = fs.readFileSync(filename, 'utf8');
    const client = await pool.connect();
    
    // SQLを分割して実行
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log('✅ Executed statement successfully');
        } catch (error) {
          console.log('⚠️  Statement failed:', error.message);
          // エラーがあっても続行
        }
      }
    }
    
    client.release();
    console.log('✅ SQL file execution completed');
    
  } catch (error) {
    console.error('❌ Error executing SQL file:', error.message);
  }
}

// 必要なテーブルを作成するSQL
const createTablesSQL = `
-- 管理事業所テーブル
CREATE TABLE IF NOT EXISTS management_offices (
    id SERIAL PRIMARY KEY,
    office_name VARCHAR(100) NOT NULL,
    office_code VARCHAR(20),
    location VARCHAR(100),
    responsible_area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 保守基地テーブル
CREATE TABLE IF NOT EXISTS maintenance_bases (
    id SERIAL PRIMARY KEY,
    base_name VARCHAR(100) NOT NULL,
    base_type VARCHAR(50) DEFAULT 'maintenance',
    location VARCHAR(100),
    management_office_id INTEGER REFERENCES management_offices(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- サンプルデータの挿入
INSERT INTO management_offices (office_name, office_code, location, responsible_area) VALUES
('本社保守事業所', 'HQ001', '東京', '関東地区'),
('関西支社保守事業所', 'KS001', '大阪', '関西地区'),
('福山保線作業所', 'FK001', '広島県福山市', '中国地区')
ON CONFLICT (id) DO NOTHING;

INSERT INTO maintenance_bases (base_name, base_type, location, management_office_id) VALUES
('本社保守基地', 'maintenance', '東京', 1),
('関西保守基地', 'maintenance', '大阪', 2),
('東福山保守基地', 'maintenance', '広島県福山市', 3)
ON CONFLICT (id) DO NOTHING;
`;

async function createTables() {
  console.log('Creating tables...');
  
  try {
    const client = await pool.connect();
    
    // SQLを分割して実行
    const statements = createTablesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log('✅ Table created/updated successfully');
        } catch (error) {
          console.log('⚠️  Statement failed:', error.message);
        }
      }
    }
    
    client.release();
    console.log('✅ Tables creation completed');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  }
}

// メイン実行
async function main() {
  console.log('🚀 Starting database setup...');
  
  await createTables();
  
  // SQLファイルがある場合は実行
  const sqlFile = '20-maintenance-cycle-system.sql';
  if (fs.existsSync(sqlFile)) {
    await executeSQLFile(sqlFile);
  }
  
  await pool.end();
  console.log('✅ Database setup completed');
}

main().catch(console.error); 