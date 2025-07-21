import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

dotenv.config();

async function restoreDatabase(backupFile = null) {
  try {
    console.log('🔄 Starting database restore...');
    
    const backupDir = join(__dirname, '..', 'data', 'backups');
    
    if (!existsSync(backupDir)) {
      console.error('❌ Backup directory not found');
      process.exit(1);
    }
    
    let targetBackupFile = backupFile;
    
    // バックアップファイルが指定されていない場合、最新のものを使用
    if (!targetBackupFile) {
      const backupFiles = readdirSync(backupDir)
        .filter(file => file.endsWith('.sql'))
        .sort()
        .reverse();
      
      if (backupFiles.length === 0) {
        console.error('❌ No backup files found');
        process.exit(1);
      }
      
      targetBackupFile = backupFiles[0];
      console.log(`📄 Using latest backup: ${targetBackupFile}`);
    }
    
    const fullBackupPath = join(backupDir, targetBackupFile);
    
    if (!existsSync(fullBackupPath)) {
      console.error(`❌ Backup file not found: ${fullBackupPath}`);
      process.exit(1);
    }
    
    // データベース設定
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'railway_maintenance',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };
    
    // データベースを削除して再作成
    console.log('🗑️  Dropping existing database...');
    const dropCommand = `PGPASSWORD="${dbConfig.password}" dropdb -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} ${dbConfig.database}`;
    try {
      await execAsync(dropCommand);
    } catch (error) {
      console.log('ℹ️  Database does not exist, creating new one...');
    }
    
    console.log('🏗️  Creating new database...');
    const createCommand = `PGPASSWORD="${dbConfig.password}" createdb -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} ${dbConfig.database}`;
    await execAsync(createCommand);
    
    // バックアップを復元
    console.log(`📄 Restoring from backup: ${targetBackupFile}`);
    const restoreCommand = `PGPASSWORD="${dbConfig.password}" psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${fullBackupPath}"`;
    await execAsync(restoreCommand);
    
    console.log('✅ Database restore completed successfully!');
    
  } catch (error) {
    console.error('❌ Database restore failed:', error.message);
    process.exit(1);
  }
}

// コマンドライン引数からバックアップファイル名を取得
const backupFile = process.argv[2];
restoreDatabase(backupFile); 