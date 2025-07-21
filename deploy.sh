#!/bin/bash

# 鉄道保守システム デプロイスクリプト
# 使用方法: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo "🚀 鉄道保守システムを ${ENVIRONMENT} 環境にデプロイします..."

# 環境変数ファイルの確認
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    echo "❌ 環境変数ファイル .env.${ENVIRONMENT} が見つかりません"
    exit 1
fi

# 環境変数を読み込み
export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)

echo "📋 環境設定:"
echo "  - 環境: ${ENVIRONMENT}"
echo "  - データベース: ${DB_NAME}"
echo "  - アプリURL: ${NEXT_PUBLIC_APP_URL}"

# Docker Composeファイルの確認
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Docker Composeファイル ${COMPOSE_FILE} が見つかりません"
    exit 1
fi

# 既存のコンテナを停止・削除
echo "🛑 既存のコンテナを停止中..."
docker-compose -f $COMPOSE_FILE down --remove-orphans

# イメージをビルド
echo "🔨 Dockerイメージをビルド中..."
docker-compose -f $COMPOSE_FILE build --no-cache

# コンテナを起動
echo "🚀 コンテナを起動中..."
docker-compose -f $COMPOSE_FILE up -d

# ヘルスチェック
echo "🏥 ヘルスチェック中..."
sleep 30

# データベース接続確認
echo "🗄️ データベース接続確認中..."
for i in {1..10}; do
    if docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U $DB_USER; then
        echo "✅ データベース接続成功"
        break
    else
        echo "⏳ データベース接続待機中... (${i}/10)"
        sleep 5
    fi
done

# アプリケーション接続確認
echo "🌐 アプリケーション接続確認中..."
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ アプリケーション接続成功"
        break
    else
        echo "⏳ アプリケーション接続待機中... (${i}/10)"
        sleep 5
    fi
done

# データベースマイグレーション実行
echo "🗃️ データベースマイグレーション実行中..."
docker-compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/18-production-database-setup.sql

echo "✅ デプロイ完了！"
echo "📊 アプリケーション: ${NEXT_PUBLIC_APP_URL}"
echo "🔍 ヘルスチェック: ${NEXT_PUBLIC_APP_URL}/api/health"

# ログ表示
echo "📝 ログを表示します (Ctrl+C で終了):"
docker-compose -f $COMPOSE_FILE logs -f 