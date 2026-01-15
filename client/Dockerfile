# ===================================
# Client (Next.js) 用 Dockerfile
# ===================================

FROM node:20-alpine AS builder

WORKDIR /app

# pnpmをインストール
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# 依存関係ファイルをコピー
COPY package.json pnpm-lock.yaml ./

# 依存関係をインストール
RUN pnpm install

# ソースコードをコピー
COPY . .

# ビルド引数 (Next.jsのビルド時に静的に埋め込まれる)
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Next.jsアプリをビルド
RUN pnpm build

# 本番ステージ
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# 本番用依存関係のみインストール
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --prod

# ビルド成果物をコピー
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 環境変数
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["pnpm", "start", "-p", "8080"]
