# 開発環境セットアップガイド

## 🚀 クイックスタート

### 1. 前提条件
- **Node.js 18+** がインストールされている
- **PostgreSQL 15+** がインストールされている
- **npm** が利用可能

### 2. 自動セットアップ（推奨）

```bash
# プロジェクトをクローン
git clone <repository-url>
cd railway-maintenance-system

# 自動セットアップを実行
npm run setup
```

### 3. 手動セットアップ

#### 3.1 依存関係のインストール
```bash
npm run install:all
```

#### 3.2 PostgreSQLのセットアップ
1. **PostgreSQLをインストール**
   - https://www.postgresql.org/download/windows/
   - インストール時にパスワードを `password` に設定

2. **データベースを作成**
```sql
CREATE DATABASE railway_maintenance;
```

3. **ユーザーを作成**
```sql
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE railway_maintenance TO postgres;
```

#### 3.3 環境変数の設定
```bash
# .env.localファイルを作成
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/railway_maintenance" > .env.local
```

#### 3.4 データベースの初期化
```bash
# データベース接続テスト
npm run test:db

# マスタテーブルの作成
npm run master:setup
```

### 4. 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 🔧 開発コマンド

### データベース管理
```bash
# データベース接続テスト
npm run test:db

# データベース構造確認
npm run db:check

# バックアップ作成
npm run db:backup

# バックアップ復元
npm run db:restore
```

### アプリケーション管理
```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm run start
```

## 🐛 トラブルシューティング

### データベース接続エラー
1. PostgreSQLが起動しているか確認
2. データベース `railway_maintenance` が存在するか確認
3. ユーザー名・パスワードが正しいか確認
4. `.env.local` ファイルの接続情報を確認

### アプリケーションが起動しない
1. ポート3000が使用されていないか確認
2. 依存関係が正しくインストールされているか確認
3. Node.jsのバージョンが18以上か確認

### 事業所マスタが登録できない
1. データベースのテーブル構造を確認
2. `station_1` などのカラムが存在するか確認
3. ブラウザの開発者ツールでエラーを確認

## 📁 プロジェクト構造

```
railway-maintenance-system/
├── client/                 # Next.jsアプリケーション
│   ├── app/               # App Router
│   ├── components/        # Reactコンポーネント
│   ├── lib/              # ユーティリティ
│   └── .env.local        # クライアント環境変数
├── server/                # Express.jsサーバー（オプション）
├── scripts/               # データベーススクリプト
├── .env.local            # ルート環境変数
└── package.json          # プロジェクト設定
```

## 🚀 デプロイ

### 本番環境へのデプロイ
1. **Vercel**（推奨）
   - GitHubリポジトリと連携
   - 自動デプロイ設定
   - 環境変数の設定

2. **その他のプラットフォーム**
   - Netlify
   - Railway
   - Heroku

### 環境変数の設定
本番環境では以下の環境変数を設定：
- `DATABASE_URL`: 本番PostgreSQLの接続URL
- `NEXTAUTH_SECRET`: セッション暗号化キー
- `NEXTAUTH_URL`: 本番URL 