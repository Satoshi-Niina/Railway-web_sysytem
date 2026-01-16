# ===================================
# Client (Next.js) 用 Dockerfile
# ===================================

FROM node:20 AS builder

WORKDIR /app

# pnpmをインストール
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# 依存関係ファイルをコピー
COPY package.json pnpm-lock.yaml ./

# 依存関係をインストール
RUN pnpm install --no-frozen-lockfile

# ソースコードをコピー
COPY . .

# 環境変数（Railwayから自動的に渡される）
# ARGは不要 - Railwayの環境変数を直接使用
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
RUN pnpm build

# 本番ステージ
FROM node:20 AS runner

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
