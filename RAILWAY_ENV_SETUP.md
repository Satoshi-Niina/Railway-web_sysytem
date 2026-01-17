# Railway 環境変数設定ガイド

## 🚨 **緊急：デプロイ後に必ず設定が必要な環境変数** 🚨

Railway ダッシュボードで以下の環境変数を**すべて**設定してください。
設定後、必ず **Redeploy** を実行してください。

---

## 必須環境変数一覧

### **1. データベース接続（サーバー用）** ⚠️ 最重要
```bash
DATABASE_URL=postgresql://ユーザー名:パスワード@ホスト:ポート/データベース名
```

**例：**
```bash
DATABASE_URL=postgresql://postgres:your_password@35.221.xxx.xxx:5432/webappdb
```

**確認方法：**
- Cloud SQL インスタンスのIPアドレスを使用
- パブリックIPまたはCloud SQL Proxyを経由

### **2. 認証設定（クライアント用）**

#### ダッシュボード認証を**有効**にする場合（推奨）
```bash
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_DASHBOARD_URL=https://your-dashboard-url.com
```

#### ダッシュボード認証を**無効**にする場合（開発・テスト用）
```bash
NEXT_PUBLIC_ENABLE_AUTH=false
```

**注意：**
- `NEXT_PUBLIC_ENABLE_AUTH=false` の場合、誰でもアクセス可能になります
- 本番環境では必ず `true` に設定してください

### **3. CORS設定（サーバー用）**
```bash
ALLOWED_ORIGINS=https://your-client-url.railway.app,https://your-dashboard-url.com
```

**説明：**
- クライアントとダッシュボードのURLをカンマ区切りで指定
- Railway の自動生成URLまたはカスタムドメイン

### **4. Node.js環境**
```bash
NODE_ENV=production
```

**自動設定：** Railwayが自動的に設定するため、通常は不要です

---

## ダッシュボードからのトークン構造

ダッシュボードから送信されるユーザー情報（JWT payload）:

```javascript
{
  id: number,              // ユーザーID
  username: string,        // ユーザー名
  displayName: string,     // 表示名（Emergency-Assistanceで必要）
  role: string,            // ロール（admin, operator, viewer等）
  department: string,      // 所属部署（Emergency-Assistanceで必要）
  iat: number             // 発行時刻（Unix timestamp）
}
```

### アクセス許可ロール
- `admin` - システム管理者
- `operator` - 運用管理者
- `system_admin` - システム管理者
- `operation_manager` - 運用管理者

### アクセス拒否ロール
- `viewer` - 閲覧者
- `user` - 一般ユーザー
- `guest` - ゲスト
- `readonly` - 読み取り専用

## 設定手順

1. Railway ダッシュボードにアクセス
2. プロジェクト → Variables タブ
3. 以下の環境変数を追加：

```
変数名: NEXT_PUBLIC_ENABLE_AUTH
値: true （または false）

変数名: NEXT_PUBLIC_DASHBOARD_URL
値: https://your-dashboard-url.com （認証有効時のみ）
```

4. Deploy → Redeploy を実行

## 動作確認

### 認証有効時（NEXT_PUBLIC_ENABLE_AUTH=true）
- ユーザー情報がない → ダッシュボードにリダイレクト
- 一般ユーザー（viewer） → Unauthorized ページ表示
- 管理者・運用者 → アクセス許可

### 認証無効時（NEXT_PUBLIC_ENABLE_AUTH=false）
- 全ユーザーが直接アクセス可能（開発・テスト用）

## トラブルシューティング

### 本番環境で認証が機能しない場合

1. Railway の Variables を確認
2. `NEXT_PUBLIC_` プレフィックスが正しいか確認
3. Redeploy を実行してビルドをやり直す
4. ブラウザのキャッシュをクリア（Ctrl+Shift+Delete）

### キャッシュ問題が発生する場合

以下のコマンドでローカルキャッシュをクリア：
```bash
rm -rf client/.next
rm -rf client/.turbo
```

Railway で完全な再デプロイ：
1. Settings → General → Remove All Service Files
2. Deploy → Redeploy
