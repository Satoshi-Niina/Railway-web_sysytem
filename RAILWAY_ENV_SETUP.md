# Railway 環境変数設定ガイド

## 重要：本番環境で認証を有効にするための設定

Railway の環境変数に以下を設定してください。

### 必須環境変数

#### ダッシュボード認証を**有効**にする場合（推奨）
```bash
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_DASHBOARD_URL=https://your-dashboard-url.com
```

#### ダッシュボード認証を**無効**にする場合（開発・テスト用）
```bash
NEXT_PUBLIC_ENABLE_AUTH=false
```

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
