FROM node:20 AS builder
WORKDIR /app

# キャッシュを破壊して常に最新をビルド
ARG BUILD_ID=unknown
RUN echo "REBUILD FORCE: $BUILD_ID"

RUN corepack enable && corepack prepare pnpm@9.15.3 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

# 全ソースをコピー（文法エラーのない最新版）
COPY . .

# ビルド時に環境変数を注入
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

FROM node:20 AS runner
WORKDIR /app

# すべての成果物をコピー
COPY --from=builder /app ./

ENV NODE_ENV=production
ENV PORT=8080

# Cloud Run が 8080 を期待するため、明示的に指定して起動
EXPOSE 8080
CMD ["npx", "next", "start", "-p", "8080", "-H", "0.0.0.0"]
