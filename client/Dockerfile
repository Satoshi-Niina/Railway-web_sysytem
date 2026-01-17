FROM node:20 AS builder
WORKDIR /app

# 古いキャッシュを一切使わない
ARG BUILD_ID=unknown
RUN echo "FORCE REBUILD: $BUILD_ID"

RUN corepack enable && corepack prepare pnpm@9.15.3 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DASHBOARD_URL
ARG NEXT_PUBLIC_ENABLE_AUTH
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_DASHBOARD_URL=${NEXT_PUBLIC_DASHBOARD_URL}
ENV NEXT_PUBLIC_ENABLE_AUTH=${NEXT_PUBLIC_ENABLE_AUTH}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# 実行環境は徹底的にクリーンにする
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Cloud Runから渡されるPORT。デフォルトがない場合は8080にするが、
# Cloud Run環境では自動的に注入される値が優先される
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# standaloneに必要な最小限のファイルのみをコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080

# server.js は自動的に PORT 環境変数を読み込んで起動する
CMD ["node", "server.js"]
