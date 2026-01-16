# ===================================
# Client (Next.js) 用 Dockerfile
# キャッシュバスティング強化版
# ===================================

FROM node:20 AS builder

# キャッシュバスティング用（ビルド時に毎回変わる値）
ARG CACHE_BUST=unknown
ARG BUILD_TIMESTAMP=unknown

WORKDIR /app

# pnpmをインストール
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# 依存関係ファイルをコピー
COPY package.json pnpm-lock.yaml ./

# 依存関係をインストール
RUN pnpm install --no-frozen-lockfile

# ソースコードをコピー
COPY . .

# 環境変数（GitHub ActionsとRailway両対応）
# ARG: GitHub Actionsのビルド時に渡される
# ENV: Railwayの実行時に渡される
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DASHBOARD_URL
ARG NEXT_PUBLIC_ENABLE_AUTH
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_DASHBOARD_URL=${NEXT_PUBLIC_DASHBOARD_URL}
ENV NEXT_PUBLIC_ENABLE_AUTH=${NEXT_PUBLIC_ENABLE_AUTH}

# ビルド時の環境変数
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"
# ビルド時のコード参照エラーを防ぐためのダミー値
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy

# Next.jsアプリをビルド
# キャッシュバスティング情報を表示
RUN echo "Cache bust: ${CACHE_BUST}" && \
    echo "Build timestamp: ${BUILD_TIMESTAMP}" && \
    pnpm build

# 本番ステージ
FROM node:20 AS runner

# キャッシュバスティング用
ARG CACHE_BUST=unknown
ARG BUILD_TIMESTAMP=unknown
LABEL cache.bust="${CACHE_BUST}"
LABEL build.timestamp="${BUILD_TIMESTAMP}"

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# 本番用依存関係のみインストール
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

# ビルド成果物をコピー
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 環境変数
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["pnpm", "start", "-p", "8080"]
