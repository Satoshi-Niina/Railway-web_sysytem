#!/bin/bash

set -e

echo "🚀 Railway Maintenance System 本番環境デプロイスクリプト"
echo "======================================================"

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
echo "  - NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}"

# 必須環境変数のチェック
required_vars=(
    "DATABASE_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "AWS_REGION"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_S3_BUCKET_NAME"
    "NEXT_PUBLIC_APP_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ 必須環境変数 $var が設定されていません"
        exit 1
    fi
done

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

# SSL証明書の確認
if [ ! -d "ssl" ]; then
    echo "⚠️  SSL証明書ディレクトリが存在しません"
    echo "SSL証明書を設定するか、HTTPのみで実行しますか？ (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "📝 SSL証明書の設定方法:"
        echo "1. ssl/ ディレクトリを作成"
        echo "2. cert.pem と key.pem を配置"
        echo "3. 再度このスクリプトを実行"
        exit 1
    else
        echo "⚠️  HTTPのみで実行します（本番環境では推奨されません）"
    fi
fi

# 既存のコンテナを停止
echo "🛑 既存のコンテナを停止中..."
docker-compose -f docker-compose.prod.yml down

# イメージをビルド
echo "🔨 Docker イメージをビルド中..."
docker-compose -f docker-compose.prod.yml build --no-cache

# コンテナを起動
echo "🚀 コンテナを起動中..."
docker-compose -f docker-compose.prod.yml up -d

# ヘルスチェック
echo "🏥 ヘルスチェック中..."
sleep 30

# データベースのセットアップ
echo "🗄️ データベースをセットアップ中..."
docker-compose -f docker-compose.prod.yml exec app node scripts/setup-database.js
docker-compose -f docker-compose.prod.yml exec app node scripts/setup-master-tables.js

echo "✅ 本番環境デプロイ完了！"
echo ""
echo "🌐 アプリケーションURL:"
echo "  - フロントエンド: ${NEXT_PUBLIC_APP_URL}"
echo "  - API: ${NEXT_PUBLIC_API_URL}"
echo ""
echo "📊 ログの確認:"
echo "  - docker-compose -f docker-compose.prod.yml logs -f app"
echo "  - docker-compose -f docker-compose.prod.yml logs -f nginx"
echo ""
echo "🛠️ 管理コマンド:"
echo "  - 停止: docker-compose -f docker-compose.prod.yml down"
echo "  - 再起動: docker-compose -f docker-compose.prod.yml restart"
echo "  - ログ確認: docker-compose -f docker-compose.prod.yml logs"
echo ""
echo "🔍 ヘルスチェック:"
echo "  - curl ${NEXT_PUBLIC_APP_URL}/api/health" 