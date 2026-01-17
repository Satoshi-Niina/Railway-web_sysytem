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

# 【抜本的解決】Windows側のBOMや文字コード問題をNode.jsスクリプトで完全に洗浄
RUN node -e "\
const fs = require('fs'); \
const path = require('path'); \
const walk = (dir) => { \
  fs.readdirSync(dir).forEach(f => { \
    const p = path.join(dir, f); \
    if (fs.statSync(p).isDirectory()) { \
      if (!['node_modules', '.next', '.git'].includes(f)) walk(p); \
    } else if (['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs'].includes(path.extname(p))) { \
      const b = fs.readFileSync(p); \
      if (b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) { \
        console.log('✂️ Stripped BOM from:', p); \
        fs.writeFileSync(p, b.slice(3)); \
      } \
    } \
  }); \
}; \
walk('.');"

# 環境変数（GitHub ActionsとRailway両対応）
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DASHBOARD_URL
ARG NEXT_PUBLIC_ENABLE_AUTH
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_DASHBOARD_URL=${NEXT_PUBLIC_DASHBOARD_URL}
ENV NEXT_PUBLIC_ENABLE_AUTH=${NEXT_PUBLIC_ENABLE_AUTH}

# ビルド設定
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# ビルド実行
RUN pnpm build


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
