# ===================================
# Server (Express.js) 用 Dockerfile
# キャッシュバスティング強化版
# ===================================

FROM node:20-alpine

# キャッシュバスティング用
ARG CACHE_BUST=unknown
ARG BUILD_TIMESTAMP=unknown
LABEL cache.bust="${CACHE_BUST}"
LABEL build.timestamp="${BUILD_TIMESTAMP}"

WORKDIR /app

# pnpmをインストール
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# 依存関係ファイルをコピー
COPY package.json pnpm-lock.yaml ./

# 依存関係をインストール（本番用）
RUN pnpm install --prod

# ソースコードをコピー
COPY . .

# 環境変数
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]
