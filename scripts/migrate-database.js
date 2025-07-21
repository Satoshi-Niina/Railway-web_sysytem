import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'railway_maintenance',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function createMigrationsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createTableSQL);
}

async function getExecutedMigrations() {
  const result = await pool.query('SELECT filename FROM migrations ORDER BY id');
  return result.rows.map(row => row.filename);
}

async function markMigrationAsExecuted(filename) {
  await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
}

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...');
    
    // マイグレーションテーブルを作成
    await createMigrationsTable();
    
    // 実行済みマイグレーションを取得
    const executedMigrations = await getExecutedMigrations();
    
    // SQLファイルを順番に実行
    const sqlFiles = [
      '01-create-tables.sql',
      '02-seed-data.sql',
      '03-enhanced-schema.sql',
      '04-master-data.sql',
      '05-update-inspection-types.sql',
      '06-update-sample-data.sql',
      '07-update-travel-plans-schema.sql',
      '08-update-vehicles-schema.sql',
      '09-seed-updated-vehicles.sql',
      '10-refactor-vehicle-fields.sql',
      '11-update-inspection-plan-schema.sql'
    ];

    for (const file of sqlFiles) {
      if (executedMigrations.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      const filePath = join(__dirname, '..', 'scripts', file);
      if (!existsSync(filePath)) {
        console.log(`⚠️  File ${file} not found, skipping...`);
        continue;
      }

      try {
        const sql = readFileSync(filePath, 'utf8');
        
        console.log(`📄 Executing ${file}...`);
        await pool.query(sql);
        await markMigrationAsExecuted(file);
        console.log(`✅ ${file} executed successfully`);
      } catch (error) {
        console.error(`❌ Error executing ${file}:`, error.message);
        throw error;
      }
    }

    console.log('🎉 Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateDatabase(); 