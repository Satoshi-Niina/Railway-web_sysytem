# マルチステージビルド
FROM node:18-alpine AS base

# 依存関係のインストール
FROM base AS deps
WORKDIR /app

# ルートのpackage.jsonとpackage-lock.jsonをコピー
COPY package*.json ./
COPY client/package*.json ./client/

# 依存関係をインストール
RUN npm ci --only=production

# ビルドステージ
FROM base AS builder
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

# ソースコードをコピー
COPY . .

# クライアントをビルド
WORKDIR /app/client
RUN npm run build

# 本番ステージ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルをコピー
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/client/.next/standalone ./
COPY --from=builder /app/client/.next/static ./client/.next/static

# 権限を設定
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# アプリケーションを起動
CMD ["node", "server.js"] 