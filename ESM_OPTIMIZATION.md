# Node.js 22 + JSX (ESM) 最適化プロジェクト設定ガイド

## 🚀 プロジェクト構成

このプロジェクトはNode.js 22 + JSX (ESM)で完全に最適化されています。

### 主要な特徴

#### 1. **Node.js 22専用最適化**
- ESM (ECMAScript Modules) をネイティブサポート
- 最新のJavaScript機能 (ES2023)
- Turbopack による超高速ビルド
- 型削除機能のネイティブサポート

#### 2. **Next.js 15 最新安定版**
- App Router完全対応
- React Server Components
- Turbopack開発サーバー
- 自動コード分割最適化

#### 3. **完全ESM構成**
```json
{
  "type": "module"  // すべてのパッケージ
}
```

## 📦 パッケージバージョン

### クライアント (Next.js)
- **Next.js**: 15.1.3
- **React**: 19.0.0
- **TypeScript**: 5.7.2
- **Tailwind CSS**: 3.4.17
- **Node.js**: 22.x

### サーバー (Express)
- **Express**: 4.21.2
- **PostgreSQL**: 8.13.1
- **Better-SQLite3**: 11.8.1
- **Node.js**: 22.x

## 🛠️ 開発コマンド

### 推奨開発フロー

```bash
# 1. 依存関係のインストール
npm run install:all

# 2. 開発サーバー起動 (Turbopack有効)
npm run dev

# 3. クライアントのみ (Turbopack)
npm run dev:client

# 4. サーバーのみ (Watch Mode)
npm run dev:server
```

### Node.js 22の新機能活用

```bash
# サーバー開発 - 型削除 + Watch Mode
cd server
npm run dev  # node --watch --experimental-strip-types server.js

# クライアント開発 - Turbopack
cd client
npm run dev  # next dev --turbopack
```

## ⚙️ 設定ファイル

### 1. Next.js設定 (next.config.mjs)

```javascript
// Node.js 22最適化済み
export default {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    turbo: { /* Turbopack設定 */ },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts'
    ],
  },
}
```

### 2. TypeScript設定 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "verbatimModuleSyntax": true
  }
}
```

### 3. ESLint 9.x Flat Config

```javascript
// eslint.config.mjs
export default [
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
  },
]
```

## 🚀 パフォーマンス最適化

### 1. コード分割戦略

```javascript
// next.config.mjs - webpack最適化
webpack: (config, { dev, isServer }) => {
  config.optimization.splitChunks = {
    cacheGroups: {
      framework: { /* React/Next.js */ },
      lib: { /* 大きなライブラリ */ },
      commons: { /* 共通コード */ },
    },
  }
}
```

### 2. 動的インポート

```jsx
// コンポーネントの遅延読み込み
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false,
})
```

### 3. useMemo/useCallback活用

```jsx
// 再レンダリング最適化
const filteredData = useMemo(() => 
  data.filter(item => condition),
  [data, condition]
)

const handleClick = useCallback(() => {
  // 処理
}, [dependencies])
```

## 🔧 Node.js 22新機能

### 1. 型削除 (Type Stripping)

```bash
# TypeScriptをトランスパイルなしで実行
node --experimental-strip-types server.ts
```

### 2. Watch Mode

```bash
# ファイル変更を自動検知して再起動
node --watch server.js
```

### 3. ESM Import Attributes

```javascript
// JSON直接インポート
import data from './data.json' with { type: 'json' }
```

## 📊 ビルド & デプロイ

### 開発環境

```bash
# Turbopack開発サーバー (超高速)
npm run dev

# 型チェック
cd client && npm run type-check

# Lint
npm run lint
```

### 本番ビルド

```bash
# ビルド
npm run build

# 本番起動
npm run start
```

### Docker (推奨)

```dockerfile
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

## 🎯 ESM移行チェックリスト

- ✅ すべてのpackage.jsonに`"type": "module"`
- ✅ `import/export`構文使用
- ✅ `__dirname`の代わりに`import.meta.url`
- ✅ `.mjs`拡張子または明示的な拡張子指定
- ✅ `require()`の代わりに`import()`
- ✅ Top-level await使用可能

### ESM変換例

```javascript
// ❌ CommonJS (旧)
const express = require('express')
const { join } = require('path')

// ✅ ESM (新)
import express from 'express'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
```

## 🐛 トラブルシューティング

### 問題: ESMエラー

```bash
Error [ERR_REQUIRE_ESM]: require() of ES Module not supported
```

**解決策:**
```json
// package.json
{
  "type": "module"
}
```

### 問題: Turbopackエラー

```bash
Error: Turbopack is not compatible with...
```

**解決策:**
```bash
# 通常モードで起動
npm run dev -- --no-turbo
```

### 問題: 型エラー

```bash
# 型チェック実行
npm run type-check

# 型生成
npx tsc --noEmit
```

## 📚 参考資料

- [Node.js 22 Release Notes](https://nodejs.org/en/blog/release/v22.0.0)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [ESM in Node.js](https://nodejs.org/api/esm.html)
- [Turbopack](https://turbo.build/pack)

## 🎓 ベストプラクティス

### 1. ファイル構成

```
project/
├── client/          # Next.js (ESM)
│   ├── app/         # App Router
│   ├── components/  # React Components
│   └── lib/         # ユーティリティ
├── server/          # Express (ESM)
│   ├── routes/      # API Routes
│   └── controllers/ # ビジネスロジック
└── scripts/         # ユーティリティスクリプト (ESM)
```

### 2. Import規約

```javascript
// 1. Node.js組み込みモジュール
import { readFile } from 'fs/promises'

// 2. 外部パッケージ
import express from 'express'
import React from 'react'

// 3. 内部モジュール (絶対パス)
import { Button } from '@/components/ui/button'

// 4. 相対パス
import { helper } from './utils'
```

### 3. 非同期処理

```javascript
// Top-level await (ESM)
const data = await fetch('/api/data')
const json = await data.json()

// Dynamic import
const module = await import('./module.js')
```

## 🔄 アップデート戦略

### 定期更新

```bash
# 更新可能なパッケージ確認
npm run check-updates:all

# インタラクティブ更新
npm run update:interactive

# 全パッケージ更新
npm run update:all
```

### セキュリティ監査

```bash
# 脆弱性チェック
npm run audit

# 自動修正
npm run audit:fix
```

## 🎉 まとめ

このプロジェクトは以下の点で最適化されています：

1. **Node.js 22**: 最新機能をフル活用
2. **完全ESM**: モダンなモジュールシステム
3. **Turbopack**: 超高速開発サーバー
4. **型安全**: TypeScript + JSX
5. **自動最適化**: コード分割、Tree-shaking
6. **セキュリティ**: 最新パッケージ + ヘッダー設定

すべてが最新の安定版で構成されており、最高のパフォーマンスとDXを提供します！
