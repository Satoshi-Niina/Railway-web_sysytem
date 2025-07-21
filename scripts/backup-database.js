import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

dotenv.config();

async function backupDatabase() {
  try {
    console.log('💾 Starting database backup...');
    
    // バックアップディレクトリを作成
    const backupDir = join(__dirname, '..', 'data', 'backups');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }
    
    // タイムスタンプ付きファイル名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(backupDir, `backup-${timestamp}.sql`);
    
    // pg_dump コマンドを構築
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'railway_maintenance',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };
    
    const pgDumpCommand = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${backupFile}"`;
    
    console.log(`📄 Creating backup: ${backupFile}`);
    await execAsync(pgDumpCommand);
    
    console.log('✅ Database backup completed successfully!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    
  } catch (error) {
    console.error('❌ Database backup failed:', error.message);
    process.exit(1);
  }
}

backupDatabase(); 