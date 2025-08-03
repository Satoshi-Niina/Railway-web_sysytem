# 🚀 他のPCでのDockerコンテナセットアップガイド

## 📋 前提条件

### 必要なソフトウェア
- Docker Desktop
- Docker Compose
- Git
- Node.js（ローカルテスト用）

## 🔄 セットアップ手順

### 1. リポジトリのクローン

```bash
# GitHubリポジトリをクローン
git clone https://github.com/your-username/railway-maintenance-system.git
cd railway-maintenance-system
```

### 2. 環境変数の設定

```bash
# 環境変数テンプレートをコピー
cp env.example .env

# .env ファイルを編集
nano .env
```

#### 必要な環境変数
```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# データベース設定（外部PostgreSQL）
DATABASE_URL=postgresql://username:password@your-db-host:5432/railway_maintenance

# AWS S3設定
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET_NAME=railway-maintenance-storage

# アプリケーション設定
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NODE_ENV=production
```

### 3. 外部データベースの準備

#### PostgreSQLデータベースの作成
```sql
-- 外部PostgreSQLサーバーで実行
CREATE DATABASE railway_maintenance;
CREATE USER railway_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE railway_maintenance TO railway_user;
```

### 4. Dockerコンテナの起動

#### 開発環境（ローカルPostgreSQL含む）
```bash
# 開発環境用（PostgreSQLも含む）
docker-compose up -d
```

#### 本番環境（外部PostgreSQL使用）
```bash
# 本番環境用（外部データベース使用）
docker-compose -f docker-compose.prod.yml up -d
```

### 5. データベースのセットアップ

```bash
# スキーマとマスタデータの設定
docker-compose exec app node scripts/setup-database.js
docker-compose exec app node scripts/setup-master-tables.js
```

### 6. 動作確認

```bash
# ヘルスチェック
curl http://localhost:3000/api/health

# ブラウザでアクセス
open http://localhost:3000
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. データベース接続エラー
```bash
# 接続テスト
docker-compose exec app node scripts/test-database-connection.js
```

#### 2. 環境変数エラー
```bash
# 環境変数の確認
docker-compose exec app env | grep DATABASE_URL
```

#### 3. ポート競合
```bash
# 使用中のポート確認
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
```

## 📊 管理コマンド

### コンテナの管理
```bash
# コンテナの起動
docker-compose up -d

# コンテナの停止
docker-compose down

# ログの確認
docker-compose logs -f

# コンテナの再起動
docker-compose restart
```

### データベースの管理
```bash
# バックアップ
docker-compose exec app node scripts/backup-database.js

# 復元
docker-compose exec app node scripts/restore-database.js

# マイグレーション
docker-compose exec app node scripts/migrate-database.js
```

## 🔒 セキュリティ注意事項

### 1. 環境変数の管理
- `.env` ファイルは絶対にGitにコミットしない
- 機密情報は環境変数で管理
- 本番環境ではシークレット管理サービスを使用

### 2. データベースのセキュリティ
- 強力なパスワードを使用
- ファイアウォールでアクセス制限
- SSL接続を有効化

### 3. ネットワークセキュリティ
- 不要なポートは公開しない
- リバースプロキシでアクセス制御
- HTTPS通信を強制

## 📈 パフォーマンス最適化

### 1. リソース設定
```yaml
# docker-compose.yml でリソース制限
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### 2. ログローテーション
```yaml
# ログサイズの制限
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🚀 本番環境への移行

### 1. ドメイン設定
```bash
# SSL証明書の配置
mkdir ssl
# cert.pem と key.pem を配置
```

### 2. リバースプロキシ設定
```bash
# nginx.conf の編集
# ドメイン名とSSL設定を更新
```

### 3. 監視設定
```bash
# ヘルスチェックの設定
# ログ監視の設定
# アラートの設定
``` 