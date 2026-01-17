FROM node:20 AS builder
WORKDIR /app

# キャッシュバスティング用
ARG BUILD_ID=unknown
RUN echo "FORCE REBUILD ID: $BUILD_ID"

RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

# 全ファイルをコピー
COPY . .

# 環境変数
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DASHBOARD_URL
ARG NEXT_PUBLIC_ENABLE_AUTH
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_DASHBOARD_URL=${NEXT_PUBLIC_DASHBOARD_URL}
ENV NEXT_PUBLIC_ENABLE_AUTH=${NEXT_PUBLIC_ENABLE_AUTH}
ENV NEXT_TELEMETRY_DISABLED=1

# ビルド実行（キャッシュを使わせない）
RUN pnpm build

FROM node:20 AS runner
WORKDIR /app
COPY --from=builder /app ./
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["pnpm", "start", "-p", "8080"]
