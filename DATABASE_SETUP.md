# データベース接続設定ガイド

## 概要
運用計画コンポーネントでマスタデータ（管理事業所・保守基地・保守用車）が読み込まれない問題を解決するための設定ガイドです。

## 問題の原因
1. データベース接続の環境変数が設定されていない
2. PostgreSQLデータベースが起動していない
3. データベースにマスタデータが存在しない

## 解決方法

### 1. 環境変数の設定

#### Next.jsアプリケーション用の環境変数ファイルを作成

`client/.env.local` ファイルを作成し、以下の内容を設定してください：

```env
# データベース設定
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/railway_maintenance_staging
DB_HOST=localhost
DB_PORT=5433
DB_NAME=railway_maintenance_staging
DB_USER=postgres
DB_PASSWORD=staging_password

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# セキュリティ設定
NEXTAUTH_SECRET=development_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# ログ設定
LOG_LEVEL=debug

# パフォーマンス設定
NEXT_TELEMETRY_DISABLED=1
```

### 2. データベースの起動

#### Dockerを使用する場合

1. Docker Desktopを起動
2. プロジェクトルートで以下のコマンドを実行：

```bash
docker-compose up -d
```

#### 手動でPostgreSQLを起動する場合

1. PostgreSQLをインストール
2. データベースを作成：

```sql
CREATE DATABASE railway_maintenance_staging;
```

3. ユーザーを作成：

```sql
CREATE USER postgres WITH PASSWORD 'staging_password';
GRANT ALL PRIVILEGES ON DATABASE railway_maintenance_staging TO postgres;
```

### 3. データベーススキーマの作成

プロジェクトルートで以下のコマンドを実行してデータベーススキーマを作成：

```bash
node scripts/setup-database.js
```

### 4. マスタデータの投入

以下のスクリプトを実行してマスタデータを投入：

```bash
node scripts/setup-maintenance-system.js
```

### 5. アプリケーションの再起動

環境変数を変更した場合は、Next.jsアプリケーションを再起動してください：

```bash
cd client
npm run dev
```

## トラブルシューティング

### 1. データベース接続エラーの確認

ブラウザで以下のURLにアクセスしてデータベース接続状態を確認：

```
http://localhost:3000/api/health
```

### 2. 個別APIエンドポイントのテスト

以下のURLで各マスタデータの取得をテスト：

- 管理事業所: `http://localhost:3000/api/management-offices`
- 保守基地: `http://localhost:3000/api/maintenance-bases`
- 車両: `http://localhost:3000/api/vehicles`

### 3. モックデータの使用

データベース接続ができない場合は、コンポーネントが自動的にモックデータを使用します。
エラーメッセージに「モックデータを表示しています」と表示される場合は、データベース接続の問題です。

### 4. よくあるエラー

#### "Database not configured"
- 環境変数 `DATABASE_URL` が設定されていない
- `.env.local` ファイルが正しい場所に配置されていない

#### "Connection refused"
- PostgreSQLが起動していない
- ポート番号が間違っている
- ファイアウォールが接続をブロックしている

#### "Authentication failed"
- ユーザー名またはパスワードが間違っている
- データベースユーザーの権限が不足している

## 開発環境での推奨設定

開発時は以下の設定を推奨します：

1. **Docker Compose**を使用してデータベースを起動
2. **環境変数ファイル**を適切に設定
3. **モックデータフォールバック**機能を活用
4. **ヘルスチェックAPI**で接続状態を監視

## 本番環境での注意点

1. 本番環境では適切なデータベース認証情報を使用
2. 環境変数は安全に管理（.envファイルをGitにコミットしない）
3. データベースのバックアップを定期的に実行
4. 接続プールの設定を最適化 