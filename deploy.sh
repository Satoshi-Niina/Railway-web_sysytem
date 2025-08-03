#!/bin/bash

set -e

echo "🚀 Railway Maintenance System デプロイスクリプト"
echo "================================================"

# 環境変数ファイルの確認
if [ ! -f .env ]; then
    echo "❌ .env ファイルが見つかりません"
    echo "env.example をコピーして .env を作成してください"
    exit 1
fi

# 環境変数を読み込み
source .env

echo "📋 環境変数の確認:"
echo "  - DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "  - NODE_ENV: $NODE_ENV"
echo "  - NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:20}..."

# Docker Compose の確認
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose がインストールされていません"
    exit 1
fi

# データベースの接続テスト
echo "🔍 データベース接続をテスト中..."
if node scripts/test-database-connection.js; then
    echo "✅ データベース接続成功"
else
    echo "❌ データベース接続失敗"
    exit 1
fi

# 既存のコンテナを停止
echo "🛑 既存のコンテナを停止中..."
docker-compose down

# イメージをビルド
echo "🔨 Docker イメージをビルド中..."
docker-compose build --no-cache

# コンテナを起動
echo "🚀 コンテナを起動中..."
docker-compose up -d

# ヘルスチェック
echo "🏥 ヘルスチェック中..."
sleep 30

# データベースのセットアップ
echo "🗄️ データベースをセットアップ中..."
docker-compose exec app node scripts/setup-database.js
docker-compose exec app node scripts/setup-master-tables.js

echo "✅ デプロイ完了！"
echo ""
echo "🌐 アプリケーションURL:"
echo "  - フロントエンド: https://localhost"
echo "  - API: https://localhost/api"
echo ""
echo "📊 ログの確認:"
echo "  - docker-compose logs -f app"
echo "  - docker-compose logs -f postgres"
echo ""
echo "🛠️ 管理コマンド:"
echo "  - 停止: docker-compose down"
echo "  - 再起動: docker-compose restart"
echo "  - ログ確認: docker-compose logs" 