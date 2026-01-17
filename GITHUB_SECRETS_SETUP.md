# GitHub Secrets セットアップガイド

このドキュメントでは、Cloud Runへのデプロイに必要なGitHub Secretsの設定方法を説明します。

## 📋 必要なGitHub Secrets一覧

以下のシークレットをGitHubリポジトリに設定する必要があります。

### 🔐 認証・プロジェクト情報

| シークレット名 | 説明 | 設定値の例 |
|--------------|------|----------|
| `GCP_PROJECT_ID` | GCPプロジェクトID | `maint-vehicle-management` |
| `GCP_SA_KEY` | GCPサービスアカウントキー（JSON） | `{...}` |

### 💾 データベース接続

| シークレット名 | 説明 | 設定値 |
|--------------|------|--------|
| `DATABASE_URL` | 通常のデータベースURL（後方互換性用） | `postgresql://postgres:Takabeni@localhost:55432/webappdb` |
| `DATABASE_URL_PRODUCTION` | **Cloud SQL Socket接続用URL（推奨）** | `postgresql://postgres:Takabeni@/webappdb?host=/cloudsql/maint-vehicle-management:asia-northeast2:free-trial-first-project` |
| `CLOUD_SQL_INSTANCE_CONNECTION_NAME` | Cloud SQLインスタンス接続名 | `maint-vehicle-management:asia-northeast2:free-trial-first-project` |

### 🌐 アプリケーションURL

| シークレット名 | 説明 | 設定値 |
|--------------|------|--------|
| `NEXT_PUBLIC_APP_URL` | クライアントアプリケーションURL | `https://railway-client-800711608362.asia-northeast2.run.app` |
| `NEXT_PUBLIC_API_URL` | APIエンドポイントURL | `https://railway-server-800711608362.asia-northeast2.run.app/api` |
| `NEXT_PUBLIC_DASHBOARD_URL` | ダッシュボードURL | `https://railway-client-800711608362.asia-northeast2.run.app` |

### 🔒 セキュリティ設定

| シークレット名 | 説明 | 設定値の例 |
|--------------|------|----------|
| `SESSION_SECRET` | セッション暗号化キー | ランダムな長い文字列 |
| `ALLOWED_ORIGINS` | CORS許可オリジン | `https://railway-client-800711608362.asia-northeast2.run.app` |

### 🔄 その他（オプション）

| シークレット名 | 説明 | 設定値の例 |
|--------------|------|----------|
| `NODE_ENV` | 環境変数（通常はワークフローで設定） | `production` |
| `POSTGRES_URL` | PostgreSQL接続URL（必要に応じて） | - |

---

## 📝 重要な設定ポイント

### ✅ DATABASE_URL_PRODUCTION の形式
Cloud SQL Socket接続を使用する場合、以下の形式で設定してください：

```
postgresql://[USER]:[PASSWORD]@/[DATABASE_NAME]?host=/cloudsql/[CONNECTION_NAME]
```

**例:**
```
postgresql://postgres:Takabeni@/webappdb?host=/cloudsql/maint-vehicle-management:asia-northeast2:free-trial-first-project
```

### ✅ SSLについて
Cloud SQL Socketを使用する場合、SSL接続は**不要**です。
- `server/.env.production` で `DB_SSL_ENABLED=false` が設定されています
- `server/db.js` でCloud SQL Socket使用時は自動的にSSLが無効化されます

### ✅ 環境変数の優先順位
本番環境では以下の優先順位で接続文字列が選択されます：
1. `DATABASE_URL_PRODUCTION` （最優先、Cloud SQL Socket用）
2. `DATABASE_URL` + `CLOUD_SQL_INSTANCE_CONNECTION_NAME` （自動変換）
3. `DATABASE_URL` のみ（通常のTCP接続）

---

## 🚀 デプロイの流れ

1. **GitHub Secretsを設定**
   - リポジトリの Settings > Secrets and variables > Actions で設定

2. **コードをプッシュ**
   ```bash
   git add .
   git commit -m "Fix database connection with Cloud SQL Socket"
   git push origin main
   ```

3. **GitHub Actionsを確認**
   - リポジトリの Actions タブで進行状況を確認
   - デプロイが成功すると、Cloud RunのURLが表示されます

4. **動作確認**
   - デプロイされたURLにアクセス
   - データベース接続が正常に機能するか確認

---

## 🔍 トラブルシューティング

### エラー: "The server does not support SSL connections"

**原因:**
- `DATABASE_URL_PRODUCTION` が設定されていない
- `CLOUD_SQL_INSTANCE_CONNECTION_NAME` が正しくない
- `DB_SSL_ENABLED=false` が設定されていない

**解決策:**
1. GitHub Secretsで `DATABASE_URL_PRODUCTION` が正しく設定されているか確認
2. Cloud SQL Socket形式の接続文字列を使用しているか確認
3. デプロイログでSSL設定が `false` になっているか確認

### ログの確認方法

```bash
# Cloud Runのログを確認
gcloud run services logs read railway-server --region asia-northeast2 --limit 50

# 特定のメッセージをフィルタ
gcloud run services logs read railway-server --region asia-northeast2 --limit 100 | grep "Database"
```

### 環境変数の確認

デプロイ後、サーバーのログで以下の情報が表示されます：
```
=== Database Connection Info ===
NODE_ENV: production
DATABASE_URL: postgresql://postgres:***@localhost:55432/webappdb
DATABASE_URL_PRODUCTION: postgresql://postgres:***@/webappdb?host=/cloudsql/...
CLOUD_SQL_CONNECTION_NAME: maint-vehicle-management:asia-northeast2:free-trial-first-project
✅ Using DATABASE_URL_PRODUCTION for Cloud SQL Socket connection
SSL Config: false
✅ Database connected successfully
```

---

## 📚 参考リンク

- [Cloud SQL Proxy の使用方法](https://cloud.google.com/sql/docs/postgres/connect-run)
- [Cloud Run 環境変数の設定](https://cloud.google.com/run/docs/configuring/environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/ja/actions/security-guides/encrypted-secrets)
