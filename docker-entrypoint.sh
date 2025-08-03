#!/bin/sh

# データベースのセットアップ（初回のみ）
if [ ! -f /app/.db-initialized ]; then
    echo "Setting up database..."
    cd /app
    node scripts/setup-database.js
    node scripts/setup-master-tables.js
    touch /app/.db-initialized
    echo "Database setup completed"
fi

# サーバーをバックグラウンドで起動
echo "Starting Express server..."
cd /app/server
node dist/server.js &
SERVER_PID=$!

# クライアントを起動
echo "Starting Next.js client..."
cd /app/client
node .next/standalone/server.js &
CLIENT_PID=$!

# プロセスが終了するまで待機
wait $SERVER_PID $CLIENT_PID 