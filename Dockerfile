# マルチステージビルド
FROM node:18-alpine AS base

# 依存関係のインストール
FROM base AS deps
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# クライアントビルドステージ
FROM base AS builder
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules

# ソースコードをコピー
COPY . .

# クライアントをビルド
RUN npm run build

# サーバービルドステージ
FROM base AS server
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# ソースコードをコピー
COPY . .

# サーバーをビルド
RUN npm run build

# クライアント本番ステージ
FROM base AS client-runner
WORKDIR /app

ENV NODE_ENV=production

# 非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルをコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 権限を設定
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# アプリケーションを起動
CMD ["node", "server.js"]

# サーバー本番ステージ
FROM base AS server-runner
WORKDIR /app

ENV NODE_ENV=production

# 非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# 必要なファイルをコピー
COPY --from=server /app/dist ./dist
COPY --from=server /app/node_modules ./node_modules

# 権限を設定
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

ENV PORT=3001

# アプリケーションを起動
CMD ["node", "dist/server.js"] 