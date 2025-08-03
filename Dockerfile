# マルチステージビルド - 本番環境用
FROM node:18-alpine AS base

# システムパッケージのインストール
RUN apk add --no-cache curl

# 依存関係のインストール
FROM base AS deps
WORKDIR /app

# ルートのpackage.jsonとpackage-lock.jsonをコピー
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 開発依存関係も含めてインストール（ビルドに必要）
RUN npm ci && npm cache clean --force
RUN cd client && npm ci && npm cache clean --force
RUN cd ../server && npm ci && npm cache clean --force

# ビルドステージ
FROM base AS builder
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

# ソースコードをコピー
COPY . .

# 環境変数を設定（ビルド時）
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG DATABASE_URL
ARG AWS_REGION
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_S3_BUCKET_NAME

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV AWS_REGION=$AWS_REGION
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV AWS_S3_BUCKET_NAME=$AWS_S3_BUCKET_NAME

# クライアントをビルド
WORKDIR /app/client
RUN npm run build

# サーバーをビルド
WORKDIR /app/server
RUN npm run build

# 本番環境
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルをコピー
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/client/.next/standalone ./client/.next/standalone
COPY --from=builder /app/client/.next/static ./client/.next/static
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/scripts ./scripts

# 権限を設定
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000 3001

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 起動スクリプト
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"] 