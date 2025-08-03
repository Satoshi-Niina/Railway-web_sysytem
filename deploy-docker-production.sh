#!/bin/bash

set -e

echo "🚀 Railway Maintenance System - Docker本番デプロイ"
echo "================================================"

# 環境変数ファイルの確認
if [ ! -f .env ]; then
    echo "❌ .env ファイルが見つかりません"
    exit 1
fi

source .env

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

echo "📋 環境変数確認完了"

# Dockerイメージのビルド
echo "🔨 Dockerイメージをビルド中..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --build-arg DATABASE_URL="$DATABASE_URL" \
  --build-arg AWS_REGION="$AWS_REGION" \
  --build-arg AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  --build-arg AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  --build-arg AWS_S3_BUCKET_NAME="$AWS_S3_BUCKET_NAME" \
  -t railway-maintenance-system:latest .

if [ $? -eq 0 ]; then
    echo "✅ Dockerイメージのビルド成功"
else
    echo "❌ Dockerイメージのビルド失敗"
    exit 1
fi

# 既存コンテナの停止
echo "🛑 既存コンテナを停止中..."
docker-compose -f docker-compose.prod.yml down || true

# 新しいコンテナの起動
echo "🚀 新しいコンテナを起動中..."
docker-compose -f docker-compose.prod.yml up -d

# ヘルスチェック
echo "🏥 ヘルスチェック中..."
sleep 30

# データベースのセットアップ
echo "🗄️ データベースをセットアップ中..."
docker-compose -f docker-compose.prod.yml exec app node scripts/setup-database.js
docker-compose -f docker-compose.prod.yml exec app node scripts/setup-master-tables.js

echo "✅ 本番デプロイ完了！"
echo ""
echo "🌐 アプリケーションURL: $NEXT_PUBLIC_APP_URL"
echo "📊 ログ確認: docker-compose -f docker-compose.prod.yml logs -f" 