# GitHub Secrets チェックリスト

画像で確認したGitHub Secretsと、必要な設定の比較チェックリストです。

## ✅ 確認済みのシークレット（画像より）

- [x] `ALLOWED_ORIGINS`
- [x] `CLOUD_SQL_INSTANCE` ⚠️ 注意: 正しくは `CLOUD_SQL_INSTANCE_CONNECTION_NAME` が必要
- [x] `CLOUD_SQL_INSTANCE_CONNECTION_NAME` ✅
- [x] `DATABASE_URL`
- [x] `DATABASE_URL_PRODUCTION` ✅ **重要**
- [x] `GCP_PROJECT_ID`
- [x] `GCP_SA_KEY`
- [x] `NEXT_PUBLIC_API_URL`
- [x] `NEXT_PUBLIC_APP_URL`
- [x] `NEXT_PUBLIC_DASHBOARD_URL`
- [x] `NODE_ENV`
- [x] `POSTGRES_URL` ⚠️ （使用していない可能性あり）
- [x] `SESSION_SECRET`

## 📋 必須シークレットの確認

### 🔴 必須（欠けているとデプロイ失敗）

| シークレット名 | ステータス | 備考 |
|--------------|----------|------|
| `GCP_PROJECT_ID` | ✅ あり | `maint-vehicle-management` |
| `GCP_SA_KEY` | ✅ あり | サービスアカウントキー |
| `DATABASE_URL_PRODUCTION` | ✅ あり | **最重要** - Cloud SQL Socket接続用 |
| `CLOUD_SQL_INSTANCE_CONNECTION_NAME` | ✅ あり | `maint-vehicle-management:asia-northeast2:free-trial-first-project` |
| `SESSION_SECRET` | ✅ あり | セッション暗号化キー |
| `ALLOWED_ORIGINS` | ✅ あり | CORS設定 |

### 🟡 推奨（あった方が良い）

| シークレット名 | ステータス | 備考 |
|--------------|----------|------|
| `DATABASE_URL` | ✅ あり | 後方互換性のため |
| `NEXT_PUBLIC_APP_URL` | ✅ あり | クライアント用 |
| `NEXT_PUBLIC_API_URL` | ✅ あり | クライアント用 |
| `NEXT_PUBLIC_DASHBOARD_URL` | ✅ あり | クライアント用 |

### ⚪ オプション（不要または非推奨）

| シークレット名 | ステータス | 備考 |
|--------------|----------|------|
| `CLOUD_SQL_INSTANCE` | ⚠️ あり | 非推奨 - `CLOUD_SQL_INSTANCE_CONNECTION_NAME` を使用 |
| `POSTGRES_URL` | ⚠️ あり | 使用していない可能性 |
| `NODE_ENV` | ⚠️ あり | ワークフローで設定されているため不要 |

---

## 🔧 設定値の確認

### DATABASE_URL_PRODUCTION の値が正しいか確認

**正しい形式:**
```
postgresql://postgres:Takabeni@/webappdb?host=/cloudsql/maint-vehicle-management:asia-northeast2:free-trial-first-project
```

**チェックポイント:**
- [ ] ユーザー名は `postgres` か？
- [ ] パスワードは正しいか？
- [ ] データベース名は `webappdb` か？
- [ ] Cloud SQL接続名は `maint-vehicle-management:asia-northeast2:free-trial-first-project` か？
- [ ] `@/` の部分が正しいか（ホスト名は空）？
- [ ] `?host=/cloudsql/...` の形式が正しいか？

### CLOUD_SQL_INSTANCE_CONNECTION_NAME の値が正しいか確認

**正しい値:**
```
maint-vehicle-management:asia-northeast2:free-trial-first-project
```

**チェックポイント:**
- [ ] プロジェクトIDは `maint-vehicle-management` か？
- [ ] リージョンは `asia-northeast2` か？
- [ ] インスタンス名は `free-trial-first-project` か？
- [ ] 形式は `project:region:instance` か？

### ALLOWED_ORIGINS の値が正しいか確認

**正しい値:**
```
https://railway-client-800711608362.asia-northeast2.run.app
```

**チェックポイント:**
- [ ] プロトコルは `https://` か？
- [ ] URLは最新のデプロイURLか？
- [ ] 末尾にスラッシュが付いていないか？

---

## 🚨 よくある間違い

### 1. DATABASE_URL_PRODUCTION が設定されていない
→ 画像では **あり** なので問題なし ✅

### 2. CLOUD_SQL_INSTANCE_CONNECTION_NAME のタイポ
→ 画像では正しく設定されている ✅

### 3. SSL設定が有効になっている
→ ワークフローで `DB_SSL_ENABLED=false` を設定済み ✅

### 4. パスワードに特殊文字が含まれている
→ パスワード `Takabeni` は英数字のみなので問題なし ✅

---

## ✅ 次のステップ

1. **すべてのシークレットが正しく設定されているか確認**
   - GitHub リポジトリの Settings > Secrets and variables > Actions

2. **不要なシークレットを削除（オプション）**
   - `CLOUD_SQL_INSTANCE`（`CLOUD_SQL_INSTANCE_CONNECTION_NAME`と重複）
   - `NODE_ENV`（ワークフローで設定）
   - `POSTGRES_URL`（使用していない）

3. **コードをプッシュしてデプロイ**
   ```bash
   git add .
   git commit -m "Fix database connection configuration"
   git push origin main
   ```

4. **デプロイログを確認**
   - GitHub Actions の実行ログ
   - Cloud Run のログ（`gcloud run services logs read railway-server --region asia-northeast2 --limit 50`）

5. **動作確認**
   - デプロイされたURLにアクセス
   - データベース接続エラーが解消されているか確認

---

## 📞 問題が解決しない場合

以下の情報を確認してください：

1. **Cloud Runのログ**
   ```bash
   gcloud run services logs read railway-server --region asia-northeast2 --limit 100 | grep -E "Database|SSL|Error"
   ```

2. **環境変数が正しく設定されているか**
   ```bash
   gcloud run services describe railway-server --region asia-northeast2 --format="value(spec.template.spec.containers[0].env)"
   ```

3. **Cloud SQL Proxyが正しく接続されているか**
   ```bash
   gcloud run services describe railway-server --region asia-northeast2 --format="value(spec.template.metadata.annotations.'run.googleapis.com/cloudsql-instances')"
   ```
