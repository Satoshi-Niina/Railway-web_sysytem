#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 環境変数からデータベース接続情報を取得
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL or POSTGRES_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupMaintenanceSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 検修周期システムのセットアップを開始します...');
    
    // SQLファイルを読み込み
    const sqlFilePath = path.join(__dirname, '20-maintenance-cycle-system.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // SQLを実行
    console.log('📋 検修周期マスタテーブルを作成中...');
    await client.query(sqlContent);
    
    console.log('✅ 検修周期システムのセットアップが完了しました！');
    console.log('');
    console.log('📊 作成されたテーブル:');
    console.log('  - maintenance_cycles (検修周期マスタ)');
    console.log('  - monthly_maintenance_plans (月次検修計画)');
    console.log('  - vehicle_last_inspections (車両最終検修日)');
    console.log('');
    console.log('🔧 作成された機能:');
    console.log('  - 検修周期自動計算');
    console.log('  - 月次検修計画自動生成');
    console.log('  - 検修予定表示');
    console.log('');
    console.log('🎯 次のステップ:');
    console.log('  1. 運用計画画面で検修予定を確認');
    console.log('  2. 検修周期マスタで周期を調整');
    console.log('  3. 車両の最終検修日を更新');
    
  } catch (error) {
    console.error('❌ セットアップ中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  setupMaintenanceSystem();
}

module.exports = { setupMaintenanceSystem }; 