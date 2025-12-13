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

async function setupBaseCodeSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 基地コード自動採番システムのセットアップを開始します...');
    
    // SQLファイルを読み込み
    const sqlFilePath = path.join(__dirname, '21-auto-base-code-system.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // SQLを実行
    console.log('📋 基地コード自動採番システムを作成中...');
    await client.query(sqlContent);
    
    // テスト用の基地コード生成を実行
    console.log('🧪 基地コード自動生成のテストを実行中...');
    const testResult = await client.query('SELECT test_base_code_generation()');
    console.log('✅ 基地コード自動生成テスト完了');
    
    // 基地コード統計を表示
    console.log('📊 基地コード統計を取得中...');
    const statsResult = await client.query('SELECT * FROM base_code_statistics');
    
    console.log('✅ 基地コード自動採番システムのセットアップが完了しました！');
    console.log('');
    console.log('🔧 作成された機能:');
    console.log('  - 基地コード自動生成関数');
    console.log('  - 自動生成トリガー');
    console.log('  - 基地コード検証機能');
    console.log('  - 既存データ更新機能');
    console.log('');
    console.log('📋 基地コード形式:');
    console.log('  - 形式: [事業所コード2文字]-BASE[3桁連番]');
    console.log('  - 例: HQ-BASE001, KS-BASE002');
    console.log('');
    console.log('📊 現在の基地コード統計:');
    if (statsResult.rows.length > 0) {
      statsResult.rows.forEach(row => {
        console.log(`  - ${row.office_prefix}: ${row.base_count}件 (${row.first_base_code} ～ ${row.last_base_code})`);
      });
    } else {
      console.log('  - 基地データがありません');
    }
    console.log('');
    console.log('🎯 次のステップ:');
    console.log('  1. 保守基地マスタで新規基地を登録');
    console.log('  2. 基地コードが自動生成されることを確認');
    console.log('  3. 運用計画で基地を選択');
    
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
  setupBaseCodeSystem();
}

module.exports = { setupBaseCodeSystem }; 