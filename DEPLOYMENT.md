# 🚀 Railway Maintenance System デプロイメントガイド

## 📋 目次

1. [環境変数の設定](#環境変数の設定)
2. [GitHub Secrets の設定](#github-secrets-の設定)
3. [クラウドデプロイ](#クラウドデプロイ)
4. [データベースのセットアップ](#データベースのセットアップ)
5. [トラブルシューティング](#トラブルシューティング)

## 🔧 環境変数の設定

### 1. ローカル環境変数ファイル

```bash
# env.example をコピー
cp env.example .env

# .env ファイルを編集
nano .env
```

### 2. 必要な環境変数

#### Supabase設定
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### データベース設定
```env
DATABASE_URL=postgresql://username:password@host:port/database
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=railway_maintenance
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

#### AWS S3設定（ファイルストレージ）
```env
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET_NAME=railway-maintenance-storage
```

#### アプリケーション設定
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

## 🔐 GitHub Secrets の設定

### 1. GitHub リポジトリの設定

1. GitHub リポジトリに移動
2. Settings → Secrets and variables → Actions
3. "New repository secret" をクリック

### 2. 必要な Secrets

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `DATABASE_URL` | PostgreSQL接続URL | `postgresql://user:pass@host:5432/db` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスロールキー | `eyJ...` |
| `AWS_REGION` | AWSリージョン | `ap-northeast-1` |
| `AWS_ACCESS_KEY_ID` | AWSアクセスキーID | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWSシークレットアクセスキー | `...` |
| `AWS_S3_BUCKET_NAME` | S3バケット名 | `railway-maintenance-storage` |
| `VERCEL_TOKEN` | Vercelトークン | `...` |
| `VERCEL_ORG_ID` | Vercel組織ID | `...` |
| `VERCEL_PROJECT_ID` | VercelプロジェクトID | `...` |

## ☁️ クラウドデプロイ

### 1. Vercel デプロイ

#### 手順
1. [Vercel](https://vercel.com) にサインアップ
2. GitHub リポジトリをインポート
3. 環境変数を設定
4. デプロイ

#### 環境変数設定（Vercel）
```bash
# Vercel ダッシュボード → Project Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_database_url
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET_NAME=railway-maintenance-storage
```

### 2. Docker デプロイ

#### 手順
```bash
# 1. 環境変数ファイルを作成
cp env.example .env

# 2. デプロイスクリプトを実行
./deploy.sh
```

#### カスタムドメイン設定
```bash
# SSL証明書の配置
mkdir ssl
# cert.pem と key.pem を ssl/ ディレクトリに配置
```

### 3. AWS ECS デプロイ

#### 手順
1. ECR リポジトリを作成
2. Docker イメージをプッシュ
3. ECS クラスターを作成
4. タスク定義を作成
5. サービスをデプロイ

## 🗄️ データベースのセットアップ

### 1. PostgreSQL データベース作成

```sql
-- データベース作成
CREATE DATABASE railway_maintenance;

-- ユーザー作成
CREATE USER railway_user WITH PASSWORD 'secure_password';

-- 権限付与
GRANT ALL PRIVILEGES ON DATABASE railway_maintenance TO railway_user;
```

### 2. スキーマの適用

```bash
# ローカル環境
pnpm db:setup
pnpm master:setup

# 本番環境（Docker）
docker-compose exec app node scripts/setup-database.js
docker-compose exec app node scripts/setup-master-tables.js
```

### 3. マスタデータのインポート

```bash
# 基本データのセットアップ
pnpm basecode:setup

# 保守システムのセットアップ
pnpm maintenance:setup
```

## 🔍 トラブルシューティング

### よくある問題

#### 1. データベース接続エラー
```bash
# 接続テスト
pnpm test:db

# ログ確認
docker-compose logs postgres
```

#### 2. 環境変数エラー
```bash
# 環境変数の確認
echo $DATABASE_URL
echo $NEXT_PUBLIC_SUPABASE_URL
```

#### 3. ビルドエラー
```bash
# 依存関係の再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 4. ポート競合
```bash
# 使用中のポート確認
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
```

### ログの確認

```bash
# アプリケーションログ
docker-compose logs -f app

# データベースログ
docker-compose logs -f postgres

# Nginxログ
docker-compose logs -f nginx
```

## 📞 サポート

問題が発生した場合は以下を確認してください：

1. 環境変数の設定
2. データベース接続状態
3. ネットワーク設定
4. ログファイル

## 🔄 CI/CD パイプライン

### GitHub Actions ワークフロー

1. **テスト**: コードの品質チェック
2. **ビルド**: アプリケーションのビルド
3. **デプロイ**: 本番環境へのデプロイ

### 自動デプロイの条件

- `main` ブランチへのプッシュ
- プルリクエストのマージ
- 手動トリガー

## 📊 監視とメトリクス

### ヘルスチェック

```bash
# アプリケーションの状態確認
curl https://your-domain.com/health

# データベース接続確認
curl https://your-domain.com/api/health
```

### パフォーマンス監視

- レスポンス時間
- エラー率
- リソース使用率
- データベース接続数 