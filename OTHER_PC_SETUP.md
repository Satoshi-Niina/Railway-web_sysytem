# 🖥️ 他のPCでのセットアップ手順

## 📋 前提条件

### 必要なソフトウェア
- **Git**: バージョン管理
- **Docker Desktop**: コンテナ実行環境
- **Node.js**: ローカルテスト用（オプション）
- **テキストエディタ**: VS Code、Sublime Text など

## 🔄 セットアップ手順

### 1. **リポジトリのクローン**

```bash
# GitHubリポジトリをクローン
git clone https://github.com/Satoshi-Niina/Railway-web_sysytem.git
cd Railway-web_sysytem

# dockerブランチに切り替え
git checkout docker
```

### 2. **環境変数の設定**

```bash
# 環境変数テンプレートをコピー
cp env.example .env

# .env ファイルを編集（テキストエディタで開く）
# Windows: notepad .env
# Mac/Linux: nano .env
```

#### 必要な環境変数設定例
```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
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

### 3. **外部データベースの準備**

#### PostgreSQLデータベースの作成
```sql
-- 外部PostgreSQLサーバーで実行
CREATE DATABASE railway_maintenance;
CREATE USER railway_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE railway_maintenance TO railway_user;
```

### 4. **Dockerコンテナの起動**

#### 方法1: クイックセットアップ（推奨）
```bash
# 自動セットアップスクリプト実行
./quick-setup.sh
```

#### 方法2: 手動セットアップ
```bash
# Dockerイメージをビルド
docker-compose build

# コンテナを起動
docker-compose up -d

# データベースのセットアップ
docker-compose exec app node scripts/setup-database.js
docker-compose exec app node scripts/setup-master-tables.js
```

### 5. **動作確認**

```bash
# ヘルスチェック
curl http://localhost:3000/api/health

# ブラウザでアクセス
# Windows: start http://localhost:3000
# Mac: open http://localhost:3000
# Linux: xdg-open http://localhost:3000
```

## 🔧 開発・編集方法

### 1. **コードの編集**

```bash
# 新しい機能ブランチを作成
git checkout -b feature/new-feature

# コードを編集
# VS Code で開く例
code .

# 変更をコミット
git add .
git commit -m "Add new feature"

# プッシュ
git push origin feature/new-feature
```

### 2. **ローカル開発**

```bash
# 開発モードで起動
docker-compose -f docker-compose.yml up -d

# ログの確認
docker-compose logs -f

# コンテナ内でコマンド実行
docker-compose exec app bash
```

### 3. **テスト実行**

```bash
# テストスクリプト実行
./test-docker.sh

# データベース接続テスト
docker-compose exec app node scripts/test-database-connection.js
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

# 特定のサービスのログ
docker-compose logs -f app
docker-compose logs -f postgres
```

### データベースの管理
```bash
# バックアップ
docker-compose exec app node scripts/backup-database.js

# 復元
docker-compose exec app node scripts/restore-database.js

# マイグレーション
docker-compose exec app node scripts/migrate-database.js

# データベース構造確認
docker-compose exec app node scripts/check-database-structure.js
```

### イメージの管理
```bash
# イメージの再ビルド
docker-compose build --no-cache

# イメージの確認
docker images

# 不要なイメージの削除
docker image prune
```

## 🔒 セキュリティ注意事項

### 1. **環境変数の管理**
- `.env` ファイルは絶対にGitにコミットしない
- 機密情報は環境変数で管理
- 本番環境ではシークレット管理サービスを使用

### 2. **データベースのセキュリティ**
- 強力なパスワードを使用
- ファイアウォールでアクセス制限
- SSL接続を有効化

### 3. **ネットワークセキュリティ**
- 不要なポートは公開しない
- リバースプロキシでアクセス制御
- HTTPS通信を強制

## 🚨 トラブルシューティング

### よくある問題

#### 1. **Docker起動エラー**
```bash
# Docker Desktop が起動しているか確認
# Windows: タスクバーのDockerアイコン
# Mac: メニューバーのDockerアイコン

# Docker の状態確認
docker --version
docker-compose --version
```

#### 2. **ポート競合エラー**
```bash
# 使用中のポート確認
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Mac/Linux
lsof -i :3000
lsof -i :3001
```

#### 3. **データベース接続エラー**
```bash
# 接続テスト
docker-compose exec app node scripts/test-database-connection.js

# 環境変数の確認
docker-compose exec app env | grep DATABASE_URL
```

#### 4. **メモリ不足エラー**
```bash
# Docker Desktop の設定でメモリを増やす
# Windows: Docker Desktop > Settings > Resources > Memory
# Mac: Docker Desktop > Preferences > Resources > Memory
```

## 📈 パフォーマンス最適化

### 1. **リソース設定**
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

### 2. **ログローテーション**
```yaml
# ログサイズの制限
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🔄 更新と同期

### 1. **最新コードの取得**
```bash
# リモートの最新変更を取得
git fetch origin

# 最新のdockerブランチに切り替え
git checkout docker
git pull origin docker
```

### 2. **変更の同期**
```bash
# 変更をステージング
git add .

# コミット
git commit -m "Update local changes"

# プッシュ
git push origin docker
```

## 📞 サポート

問題が発生した場合は以下を確認してください：

1. **ログファイルの確認**
   ```bash
   docker-compose logs -f
   ```

2. **環境変数の設定**
   ```bash
   cat .env
   ```

3. **データベース接続状態**
   ```bash
   docker-compose exec app node scripts/test-database-connection.js
   ```

4. **ネットワーク設定**
   ```bash
   docker network ls
   docker network inspect railway-maintenance-system_railway-network
   ``` 