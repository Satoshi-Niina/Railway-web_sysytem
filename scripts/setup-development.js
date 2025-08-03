#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 開発環境のセットアップを開始します...\n');

// 1. 依存関係のインストール
console.log('📦 依存関係をインストール中...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ ルート依存関係のインストール完了');
  
  execSync('cd client && npm install', { stdio: 'inherit' });
  console.log('✅ クライアント依存関係のインストール完了');
  
  if (fs.existsSync('server')) {
    execSync('cd server && npm install', { stdio: 'inherit' });
    console.log('✅ サーバー依存関係のインストール完了');
  }
} catch (error) {
  console.error('❌ 依存関係のインストールに失敗しました:', error.message);
  process.exit(1);
}

// 2. 環境変数ファイルの確認
console.log('\n🔧 環境変数ファイルを確認中...');
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envLocalPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 .env.exampleを.env.localにコピー中...');
    fs.copyFileSync(envExamplePath, envLocalPath);
    console.log('✅ .env.localファイルを作成しました');
    console.log('⚠️  .env.localファイルを編集してデータベース接続情報を設定してください');
  } else {
    console.log('⚠️  .env.localファイルが見つかりません');
    console.log('   以下の内容で.env.localファイルを作成してください:');
    console.log('   DATABASE_URL=postgresql://postgres:password@localhost:5432/railway_maintenance');
  }
} else {
  console.log('✅ .env.localファイルが存在します');
}

// 3. データベース接続テスト
console.log('\n🗄️ データベース接続をテスト中...');
try {
  execSync('node scripts/test-database-connection.js', { stdio: 'inherit' });
  console.log('✅ データベース接続成功');
} catch (error) {
  console.log('⚠️ データベース接続に失敗しました');
  console.log('   以下の手順でPostgreSQLをセットアップしてください:');
  console.log('   1. PostgreSQLをインストール');
  console.log('   2. データベース "railway_maintenance" を作成');
  console.log('   3. ユーザー "postgres" を作成（パスワード: password）');
  console.log('   4. .env.localファイルの接続情報を確認');
}

console.log('\n🎉 セットアップが完了しました！');
console.log('\n📋 次のステップ:');
console.log('   1. PostgreSQLが起動していることを確認');
console.log('   2. .env.localファイルの接続情報を確認');
console.log('   3. npm run dev で開発サーバーを起動');
console.log('   4. http://localhost:3000 でアプリケーションにアクセス'); 