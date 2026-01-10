# ローカル開発環境クイックスタートガイド

## 🚀 一番簡単な起動方法（推奨）

### ワンコマンドで起動

以下のコマンド**1つだけ**で、Cloud SQL ProxyとServer起動を自動で行います：

```powershell
npm run dev:local
```

または直接スクリプトを実行：

```powershell
.\scripts\start-dev.ps1
```

これでアプリケーションが起動します：
- 📱 **フロントエンド**: http://localhost:3000
- 🔧 **バックエンド**: http://localhost:3001
- 💾 **データベース**: CloudDB（GCP Cloud SQL）

**停止方法**: `Ctrl+C` を押すだけで、Proxy・Server両方が自動停止します。

---

## 📋 手動起動（従来の方法）

もし手動で起動したい場合は、以下の順番で実行：

### 1. Cloud SQL Proxyを起動

別のPowerShellウィンドウで：

```powershell
.\scripts\start-clouddb-proxy.ps1
```

または直接コマンドで：

```powershell
.\cloud-sql-proxy.exe "maint-vehicle-management:asia-northeast2:free-trial-first-project" --address 127.0.0.1 --port 55432
```

### 2. 開発サーバーを起動

```powershell
npm run dev
```

---

## 🔧 Cloud SQL接続情報

### データベース接続設定（`.env.development`）

```env
DATABASE_URL=postgresql://postgres:Takabeni@localhost:55432/webappdb
DB_USER=postgres
DB_PASSWORD=Takabeni
DB_NAME=webappdb
DB_PORT=55432
```

### Cloud SQLインスタンス情報

- **プロジェクトID**: `maint-vehicle-management`
- **リージョン**: `asia-northeast2`（大阪）
- **インスタンス名**: `free-trial-first-project`
- **データベース**: `webappdb`
- **PostgreSQLバージョン**: 17.7

---

## 🛠️ トラブルシューティング

### よくある問題

#### 1. 「ECONNREFUSED」エラーが出る

**原因**: Cloud SQL Proxyが起動していない

**解決策**:
```powershell
# 一括起動を使用
npm run dev:local
```

#### 2. 「port already in use」エラー

**原因**: ポート3000や3001が既に使われている

**解決策**: `start-dev.ps1` スクリプトが自動でクリーンアップします

#### 3. Cloud SQL Proxyの接続に失敗する

**原因**: gcloud認証が切れている可能性

**解決策**:
```powershell
gcloud auth application-default login
```

---

## 📝 開発ワークフロー

### 日常の開発

1. **起動**
   ```powershell
   npm run dev:local
   ```

2. **開発作業を行う**
   - コード編集（ホットリロード対応）
   - ブラウザで http://localhost:3000 にアクセス

3. **停止**
   - `Ctrl+C` を押す

### DBeaver での直接DB操作

Cloud SQL Proxyが起動している間は、DBeaverでも接続できます：

- **ホスト**: `localhost`
- **ポート**: `55432`
- **データベース**: `webappdb`
- **ユーザー**: `postgres`
- **パスワード**: `Takabeni`

---

## ⚙️ その他の便利なコマンド

```powershell
# Client のみ起動
npm run dev:client

# Server のみ起動
npm run dev:server

# 本番ビルド
npm run build

# データベースセットアップ
npm run db:setup

# マスタデータ投入
npm run master:setup
```

---

## 🔐 重要な注意事項

1. **`.env.development`ファイル**: Gitで管理されていません。初回セットアップ後は手動で保存してください。

2. **Cloud SQL Proxy**: 開発中は常に起動しておく必要があります。`npm run dev:local` を使えば自動管理されます。

3. **データの保存先**: すべてCloudDB（GCP Cloud SQL）に保存されます。ローカルPostgreSQLは使用していません。

---

## 📞 サポート

問題が発生した場合は、`CLOUDDB_TROUBLESHOOTING.md` を参照してください。
