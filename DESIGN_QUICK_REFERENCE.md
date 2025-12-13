# プロジェクト設計 クイックリファレンス

## 📌 核心の設計決定

### 1. **Docker不使用**
```bash
# ❌ 使わない
docker-compose up

# ✅ 使う
pnpm dev
```

### 2. **ESMモジュール統一**
```javascript
// Server: JavaScript ESM (TypeScript削除)
import express from 'express';
import { fileURLToPath } from 'url';

// Client: TypeScript + ESM
import type { Vehicle } from '@/types';
```

### 3. **環境変数の3層構造**
```
開発: .env.development → .env (実際の設定)
本番Client: client/.env.production
本番Server: server/.env.production
```

### 4. **自動化システム**
- 毎週日曜: セキュリティチェック → 自動修正
- 毎週月曜: 安全な更新のPR自動作成
- 毎月1日: Node.js新版チェック

---

## 🏗️ ディレクトリ構造（重要部分のみ）

```
railway-maintenance-system/
├── .github/workflows/     # 自動化（GitHub Actions）
├── client/               # Next.js (TypeScript)
│   ├── app/             # ページ
│   └── components/      # Reactコンポーネント
├── server/              # Express (JavaScript ESM)
│   ├── controllers/     # ビジネスロジック
│   ├── routes/         # APIルート
│   ├── server.js       # エントリーポイント
│   └── db.js           # DB接続
└── scripts/            # DBスクリプト
```

---

## 🚀 よく使うコマンド

### 開発
```bash
# 全体起動
pnpm dev

# Clientのみ
pnpm --filter client dev

# Serverのみ
pnpm --filter server dev
```

### 依存関係管理
```bash
# 更新チェック
pnpm check-updates:all

# セキュリティ監査
pnpm audit

# 対話形式で更新
pnpm update:interactive
```

### データベース
```bash
# セットアップ
node scripts/setup-database.js

# マイグレーション
node scripts/migrate-database.js

# バックアップ
node scripts/backup-database.js
```

---

## 🔧 重要な設定ファイル

### package.json（ルート）
```json
{
  "type": "module",
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.0.0"
  },
  "workspaces": ["client", "server"]
}
```

### server/package.json
```json
{
  "type": "module",
  "scripts": {
    "dev": "node --watch server.js"
  }
}
```

### client/next.config.mjs
```javascript
const nextConfig = {
  env: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL
  }
};
```

---

## 🗄️ データベース構造

```
management_offices (管理事業所)
  ↓
bases (基地)
  ↓
vehicles (車両)
  ↓
┌────────────┬────────────┬────────────┐
│            │            │            │
operations  inspections  failures   maintenance
(運用)      (検査)       (故障)      (保守)
```

---

## 🤖 自動化の動き

### 週次フロー（管理不要）
```
日曜 3:00
  └→ セキュリティスキャン
      └→ Critical/High検出
          └→ 自動修正 & コミット
              └→ Issue通知

月曜 2:00
  └→ パッチ更新チェック
      └→ 更新あり
          └→ PR自動作成
              └→ レビュー待ち
```

### 管理者の作業（週2分）
```
月曜午前
  └→ GitHub確認
      └→ 自動PRレビュー
          └→ Merge
```

---

## 📝 環境変数テンプレート

### .env（ローカル開発）
```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
DATABASE_URL=postgresql://user:pass@localhost:5432/db
PORT=3001
```

### client/.env.production
```env
NEXT_PUBLIC_APP_URL=https://your-app.com
NEXT_PUBLIC_SERVER_URL=https://api.your-app.com
```

### server/.env.production
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/prod-db
PORT=3001
CORS_ORIGIN=https://your-app.com
```

---

## 🔐 セキュリティポリシー

| Severity | 対応 | 期限 |
|----------|------|------|
| Critical | 自動修正 | 即座 |
| High | 自動修正 | 即座 |
| Moderate | 手動 | 1ヶ月 |
| Low | 手動 | 3ヶ月 |

---

## 🎯 技術スタック早見表

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 22.x |
| Frontend | Next.js | 15.2.4 |
| UI | React | 19.x |
| Backend | Express | 4.21.2 |
| Database | PostgreSQL | 15+ |
| Language (Client) | TypeScript | 5.x |
| Language (Server) | JavaScript | ESM |
| Styling | Tailwind CSS | 3.x |

---

## 🔗 重要なリンク

- **リポジトリ**: github.com/Satoshi-Niina/Railway-web_sysytem
- **ブランチ**: docker
- **詳細設計**: PROJECT_ARCHITECTURE.md
- **自動化**: DEPENDENCY_AUTOMATION.md
- **Node.js互換性**: NODE_VERSION.md

---

## 💡 設計の原則

1. **シンプル第一**: Dockerを排除、必要最小限の構成
2. **自動化優先**: 手動作業は週2分まで削減
3. **セキュリティ**: 脆弱性は24時間以内に自動対応
4. **完全分離**: ローカルと本番は一切連携しない
5. **ESM統一**: モダンなモジュールシステム
6. **型安全性**: Clientのみ TypeScript使用

---

## 🚨 やってはいけないこと

- ❌ Dockerファイルを追加
- ❌ ServerにTypeScriptを導入
- ❌ CommonJS (`require()`) を使用
- ❌ 本番DBにローカルから接続
- ❌ `.env`をGitにコミット
- ❌ importで`.js`拡張子を省略

---

## ✅ 推奨される開発フロー

1. **機能開発**
   ```bash
   git checkout -b feature/new-feature
   # 開発
   git commit -m "feat: 新機能追加"
   git push
   # PR作成
   ```

2. **毎週月曜**
   ```
   GitHub → Pull Requests → 自動PRをレビュー → Merge
   ```

3. **セキュリティアラート**
   ```
   GitHub Issue確認 → 既に自動修正済み → 完了
   ```

---

**最終更新**: 2025年12月11日
