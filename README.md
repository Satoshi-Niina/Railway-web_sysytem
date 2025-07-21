# 鉄道保守システム (Railway Maintenance System)

鉄道車両の運用管理、保守計画、検査記録を統合的に管理するWebアプリケーションです。

## 🚀 機能

- **運用管理**: 車両の運用計画・実績管理
- **保守計画**: 検査計画・実績の管理
- **車両管理**: 車両マスタ・基地管理
- **故障管理**: 故障記録・修理記録
- **レポート**: 運用・保守の統計レポート

## 🏗️ システム構成

### データベーススキーマ

#### 主要テーブル
- **management_offices**: 管理事業所
- **bases**: 基地
- **vehicles**: 車両
- **operation_plans**: 運用計画
- **operation_records**: 運用実績
- **inspection_plans**: 検査計画
- **inspections**: 検査実績
- **failures**: 故障記録
- **repairs**: 修理記録
- **maintenance_cycles**: 保守サイクル

#### リレーション
```
management_offices (1) ←→ (N) bases
management_offices (1) ←→ (N) vehicles
bases (1) ←→ (N) vehicles
vehicles (1) ←→ (N) operation_plans
vehicles (1) ←→ (N) operation_records
vehicles (1) ←→ (N) inspection_plans
vehicles (1) ←→ (N) inspections
vehicles (1) ←→ (N) failures
failures (1) ←→ (N) repairs
```

## 🐳 クラウドデプロイ

### 前提条件
- Docker & Docker Compose
- PostgreSQL 15+
- Node.js 18+

### 1. 環境設定

```bash
# 本番環境用の環境変数ファイルをコピー
cp env.production .env.production

# 環境変数を編集
nano .env.production
```

### 2. デプロイ実行

```bash
# 本番環境にデプロイ
npm run deploy:production

# または直接実行
./deploy.sh production
```

### 3. 手動デプロイ

```bash
# Dockerイメージをビルド
npm run docker:build

# コンテナを起動
npm run docker:up

# ログを確認
npm run docker:logs
```

### 4. ヘルスチェック

```bash
# アプリケーションの状態確認
curl http://localhost:3000/api/health

# データベース接続確認
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres
```

## 🛠️ 開発環境

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp env.example .env.local
# .env.localを編集
```

### 3. データベースのセットアップ

```bash
# ローカルPostgreSQLを起動
docker-compose up -d postgres

# データベースをセットアップ
npm run db:setup
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

## 📊 データベース管理

### マイグレーション

```bash
# データベースマイグレーション実行
npm run db:migrate

# バックアップ作成
npm run db:backup

# バックアップ復元
npm run db:restore
```

### 本番環境用データベースセットアップ

```sql
-- scripts/18-production-database-setup.sql を実行
-- テーブル作成、インデックス、マスタデータ挿入
```

## 🔧 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL 15
- **UI**: Tailwind CSS, Radix UI
- **コンテナ**: Docker, Docker Compose
- **リバースプロキシ**: Nginx

## 📁 プロジェクト構造

```
railway-maintenance-system/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── operations/        # 運用管理ページ
│   ├── inspections/       # 検査管理ページ
│   ├── vehicles/          # 車両管理ページ
│   └── failures/          # 故障管理ページ
├── components/            # React コンポーネント
├── lib/                   # ユーティリティ
├── types/                 # TypeScript型定義
├── scripts/               # データベーススクリプト
├── docker-compose.yml     # 開発環境
├── docker-compose.prod.yml # 本番環境
├── nginx.conf            # Nginx設定
└── deploy.sh             # デプロイスクリプト
```

## 🔒 セキュリティ

- HTTPS強制（本番環境）
- セキュリティヘッダー設定
- SQLインジェクション対策
- 環境変数による機密情報管理

## 📈 パフォーマンス

- データベースインデックス最適化
- Gzip圧縮
- 静的ファイルキャッシュ
- コネクションプール設定

## 🚨 トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   ```bash
   # データベースの状態確認
   docker-compose logs postgres
   ```

2. **アプリケーション起動エラー**
   ```bash
   # アプリケーションログ確認
   docker-compose logs app
   ```

3. **ポート競合**
   ```bash
   # 使用中のポート確認
   netstat -tulpn | grep :3000
   ```

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. ログファイルの確認
2. 環境変数の設定
3. データベース接続状態
4. ネットワーク設定

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。 