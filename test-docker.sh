#!/bin/bash

echo "🧪 Dockerコンテナテストスクリプト"
echo "================================"

# 環境変数ファイルの確認
if [ ! -f .env ]; then
    echo "❌ .env ファイルが見つかりません"
    echo "env.example をコピーして .env を作成してください"
    exit 1
fi

# Dockerイメージのビルドテスト
echo "🔨 Dockerイメージをビルド中..."
docker build -t railway-maintenance-test .

if [ $? -eq 0 ]; then
    echo "✅ Dockerイメージのビルド成功"
else
    echo "❌ Dockerイメージのビルド失敗"
    exit 1
fi

# コンテナの起動テスト
echo "🚀 テストコンテナを起動中..."
docker run -d --name test-app \
  -p 3000:3000 \
  -p 3001:3001 \
  --env-file .env \
  railway-maintenance-test

# ヘルスチェック
echo "🏥 ヘルスチェック中..."
sleep 30

if curl -f http://localhost:3000/api/health; then
    echo "✅ アプリケーションが正常に起動"
else
    echo "❌ アプリケーションの起動に失敗"
    docker logs test-app
    docker stop test-app
    docker rm test-app
    exit 1
fi

# テストコンテナの停止
echo "🛑 テストコンテナを停止中..."
docker stop test-app
docker rm test-app

echo "✅ Dockerコンテナテスト完了！" 