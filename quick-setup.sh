#!/bin/bash

echo "🚀 Railway Maintenance System - クイックセットアップ"
echo "=================================================="

# 環境変数ファイルの確認
if [ ! -f .env ]; then
    echo "📝 環境変数ファイルを作成中..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ env.example を .env にコピーしました"
        echo "⚠️  必ず .env ファイルを編集して環境変数を設定してください"
        echo ""
        echo "📋 設定が必要な項目:"
        echo "  - DATABASE_URL (外部PostgreSQLの接続URL)"
        echo "  - NEXT_PUBLIC_SUPABASE_URL"
        echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "  - SUPABASE_SERVICE_ROLE_KEY"
        echo "  - AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
        echo "  - AWS_S3_BUCKET_NAME"
        echo "  - NEXT_PUBLIC_APP_URL"
        echo ""
        echo "設定後、このスクリプトを再実行してください"
        exit 1
    else
        echo "❌ env.example ファイルが見つかりません"
        exit 1
    fi
fi

# 環境変数を読み込み
source .env

# 必須環境変数のチェック
required_vars=(
    "DATABASE_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your_${var,,}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ 以下の環境変数が設定されていません:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "⚠️  .env ファイルを編集して設定してください"
    exit 1
fi

echo "✅ 環境変数の設定確認完了"

# Dockerの確認
if ! command -v docker &> /dev/null; then
    echo "❌ Docker がインストールされていません"
    echo "Docker Desktop をインストールしてください: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose がインストールされていません"
    exit 1
fi

echo "✅ Docker 環境確認完了"

# データベース接続テスト
echo "🔍 データベース接続をテスト中..."
if node scripts/test-database-connection.js; then
    echo "✅ データベース接続成功"
else
    echo "❌ データベース接続失敗"
    echo "DATABASE_URL を確認してください"
    exit 1
fi

# Dockerイメージのビルド
echo "🔨 Dockerイメージをビルド中..."
docker-compose build

if [ $? -eq 0 ]; then
    echo "✅ Dockerイメージのビルド成功"
else
    echo "❌ Dockerイメージのビルド失敗"
    exit 1
fi

# コンテナの起動
echo "🚀 コンテナを起動中..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "✅ コンテナの起動成功"
else
    echo "❌ コンテナの起動失敗"
    exit 1
fi

# ヘルスチェック
echo "🏥 ヘルスチェック中..."
sleep 30

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ アプリケーションが正常に起動"
else
    echo "⚠️  アプリケーションの起動に時間がかかっています"
    echo "ログを確認してください: docker-compose logs -f"
fi

# データベースのセットアップ
echo "🗄️ データベースをセットアップ中..."
docker-compose exec app node scripts/setup-database.js
docker-compose exec app node scripts/setup-master-tables.js

echo ""
echo "🎉 セットアップ完了！"
echo ""
echo "🌐 アプリケーションURL:"
echo "  - フロントエンド: http://localhost:3000"
echo "  - API: http://localhost:3001"
echo ""
echo "📊 管理コマンド:"
echo "  - ログ確認: docker-compose logs -f"
echo "  - 停止: docker-compose down"
echo "  - 再起動: docker-compose restart"
echo ""
echo "🔍 ヘルスチェック:"
echo "  - curl http://localhost:3000/api/health" 