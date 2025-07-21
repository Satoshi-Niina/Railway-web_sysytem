import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
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

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
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
      try {
        const filePath = join(__dirname, '..', 'scripts', file);
        const sql = readFileSync(filePath, 'utf8');
        
        console.log(`📄 Executing ${file}...`);
        await pool.query(sql);
        console.log(`✅ ${file} executed successfully`);
      } catch (error) {
        console.error(`❌ Error executing ${file}:`, error.message);
        // ファイルが存在しない場合はスキップ
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 