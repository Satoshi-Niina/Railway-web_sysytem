# 鉄道保守システム (Railway Maintenance System)

鉄道車両の運用管理、保守計画、検査記録を統合的に管理するWebアプリケーションです。

## 📋 目次

- [機能](#-機能)
- [技術スタック](#-技術スタック)
- [環境変数](#-環境変数)
- [ローカル開発](#-ローカル開発)
- [Cloud Runデプロイ](#-cloud-runデプロイ)
- [データベース](#-データベース)

## 🚀 機能

- **運用管理**: 車両の運用計画・実績管理
- **保守計画**: 検査計画・実績の管理
- **検修設定**: 機種別検修起算日の設定・管理
- **車両管理**: 車両マスタ・基地管理
- **故障管理**: 故障記録・修理記録
- **レポート**: 運用・保守の統計レポート

## 🔧 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 15, React 19, TypeScript |
| バックエンド | Express.js (ESM) |
| データベース | PostgreSQL 15 / Cloud SQL |
| UI | Tailwind CSS, Radix UI |
| デプロイ | Cloud Run, Cloud Build |
| パッケージ管理 | pnpm 9.x |

## 🌐 環境変数

### 必須

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | PostgreSQL接続文字列 | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | 環境 | `production` |

### 任意

| 変数名 | 説明 | デフォルト |
|--------|------|------------|
| `PORT` | アプリケーションポート | `8080` |
| `NEXT_PUBLIC_API_URL` | APIベースURL | `/api` |
| `GCP_PROJECT_ID` | GCPプロジェクトID | - |
| `GCS_BUCKET_NAME` | Cloud Storageバケット名 | `railway-maintenance-storage` |

詳細は `.env.example` を参照してください。

## 💻 ローカル開発

### 前提条件

- Node.js 20以上
- pnpm 9以上
- PostgreSQL 15以上

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/Satoshi-Niina/Railway-web_sysytem.git
cd Railway-web_sysytem

# 環境変数ファイルを作成
cp .env.example .env
# .env を編集して接続情報を設定

# 依存関係をインストール
pnpm install

# 開発サーバーを起動
pnpm dev
```

アプリケーションは `http://localhost:3000` でアクセスできます。

## ☁️ Cloud Runデプロイ

### 前提条件

- GCPプロジェクトが作成済み
- Cloud Build API、Cloud Run API が有効化済み
- gcloud CLI がインストール済み

### GitHubシークレットの設定

GitHubリポジトリの Settings > Secrets and variables > Actions で以下のシークレットを設定:

| シークレット名 | 説明 | 例 |
|---------------|------|-----|
| `GCP_PROJECT_ID` | GCPプロジェクトID | `maint-vehicle-management` |
| `GCP_SA_KEY` | サービスアカウントキー（JSON） | `{"type":"service_account",...}` |
| `CLOUD_SQL_INSTANCE_CONNECTION_NAME` | Cloud SQLインスタンス接続名 | `project:region:instance` |
| `DATABASE_URL_PRODUCTION` | 本番用DB接続文字列（Unix socket） | `postgresql://user:pass@/db?host=/cloudsql/project:region:instance` |
| `NEXT_PUBLIC_APP_URL` | ClientアプリURL | `https://railway-client-xxx.run.app` |
| `NEXT_PUBLIC_API_URL` | ServerアプリURL | `https://railway-server-xxx.run.app/api` |
| `SESSION_SECRET` | セッション秘密鍵 | ランダム文字列 |
| `ALLOWED_ORIGINS` | CORS許可オリジン | `https://railway-client-xxx.run.app` |

**重要**: 本番環境用の `DATABASE_URL_PRODUCTION` は以下の形式を使用:
```
postgresql://postgres:PASSWORD@/webappdb?host=/cloudsql/maint-vehicle-management:asia-northeast2:free-trial-first-project
```

### デプロイ手順

#### 1. GCPプロジェクトを設定

```bash
gcloud config set project YOUR_PROJECT_ID
```

#### 2. Cloud Buildでビルド＆デプロイ

```bash
gcloud builds submit --config cloudbuild.yaml .
```

#### 3. 環境変数を設定

Cloud Run コンソールで以下の環境変数を設定:

```
DATABASE_URL=postgresql://user:password@/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE
NODE_ENV=production
```

### ファイル構成

| ファイル | 説明 |
|----------|------|
| `Dockerfile` | マルチステージビルド用Dockerfile |
| `cloudbuild.yaml` | Cloud Build構成ファイル |
| `.dockerignore` | Docker除外ファイル設定 |
| `.env.example` | 環境変数テンプレート |

### Cloud SQL接続

Cloud Runから Cloud SQL (PostgreSQL) に接続する場合:

1. Cloud SQL インスタンスを作成
2. Cloud Run サービスに Cloud SQL 接続を追加
3. DATABASE_URL を Unix ソケット形式で設定:

```
postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/PROJECT:REGION:INSTANCE
```

## 📊 データベース

### スキーマ構成

| スキーマ | 説明 |
|----------|------|
| `master_data` | マスタデータ（事業所、基地、車両、検修種別等） |
| `operations` | 運用データ（計画、実績） |
| `inspections` | 検修データ（計画、実績） |
| `maintenance` | 保守データ（故障、修理） |

### 主要テーブル

- `master_data.managements_offices` - 管理事業所
- `master_data.bases` - 基地
- `master_data.machines` - 機械（車両）
- `master_data.machine_types` - 機種
- `master_data.inspection_types` - 検修種別
- `master_data.maintenance_base_dates` - 検修起算日
- `operations.operation_plans` - 運用計画
- `operations.operation_records` - 運用実績

### DBコマンド

```bash
# DB初期化
pnpm db:setup

# マスタデータ投入
pnpm master:setup

# 接続テスト
pnpm test:db

# バックアップ
pnpm db:backup
```

## 📁 プロジェクト構造

```
railway-maintenance-system/
├── client/                 # フロントエンド (Next.js)
│   ├── app/               # App Router
│   │   └── api/          # API Routes
│   ├── components/        # Reactコンポーネント
│   ├── lib/              # ユーティリティ
│   └── types/            # TypeScript型定義
├── server/                # バックエンド (Express.js)
│   ├── routes/           # APIルート
│   └── db.js            # DB接続
├── scripts/              # DBスクリプト
├── Dockerfile            # Docker設定
├── cloudbuild.yaml       # Cloud Build設定
├── .env.example          # 環境変数テンプレート
└── README.md
```

## 📄 ライセンス

MITライセンス

---

**リポジトリ**: https://github.com/Satoshi-Niina/Railway-web_sysytem