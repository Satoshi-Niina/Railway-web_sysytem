# ==================================================
# Cloud SQL 接続トラブルシューティングガイド
# ==================================================

## 現在の状況

✅ Cloud SQL Proxy: **起動中**
   - インスタンス: `maint-vehicle-management:asia-northeast1:railway-maintenance-db`
   - ポート: `55432`
   
❌ データベース接続: **ECONNRESET エラー**
   - エラー: 接続がリセットされる
   - 原因候補: 認証情報の不一致

## 確認が必要な項目

### 1. Cloud SQL Proxyのログを確認
新しく開いたPowerShellウィンドウ（Cloud SQL Proxyが実行中）で、以下のようなエラーメッセージが表示されていないか確認してください：

- ❌ `Authentication failed`
- ❌ `Access denied`
- ❌ `Invalid credentials`
- ❌ `Connection refused`

### 2. GCPコンソールでCloud SQLの設定を確認
https://console.cloud.google.com/sql/instances にアクセスし、以下を確認：

#### a) インスタンスの状態
- インスタンスが **実行中** であること
- インスタンス名: `railway-maintenance-db`

#### b) ユーザーの確認
「ユーザー」タブで：
- ユーザー `postgres` が存在するか
- パスワードが `Takabeni` で正しいか
  - 異なる場合は、GCPコンソールでパスワードを確認or変更

#### c) データベースの確認
「データベース」タブで：
- データベース `webappdb` が存在するか
  - 存在しない場合は作成が必要

#### d) 接続設定
「接続」タブで：
- **パブリックIPが有効**になっているか
- Cloud SQL Admin APIが有効になっているか

### 3. 正しい認証情報を取得したら...

正しい認証情報が判明したら、`.env.development` ファイルを更新：

```
DATABASE_URL=postgresql://[正しいユーザー名]:[正しいパスワード]@localhost:55432/[正しいDB名]
DB_USER=[正しいユーザー名]
DB_PASSWORD=[正しいパスワード]
DB_NAME=[正しいDB名]
```

その後、開発サーバーを再起動：
```powershell
# 既存のサーバーを停止（Ctrl+C）
npm run dev
```

## トラブルシューティングフロー

1. **Cloud SQL Proxyログ確認** → エラーがあれば認証情報を修正
2. **GCPコンソール確認** → データベース/ユーザーが存在するか確認
3. **認証情報更新** → `.env.development` を更新
4. **開発サーバー再起動** → `npm run dev` で再起動
5. **動作確認** → ブラウザで http://localhost:3000 にアクセス

## 次のステップ

上記を確認後、正しい認証情報またはエラーメッセージを教えてください。
それに基づいて適切な修正を行います。
