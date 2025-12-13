# Node.js 22 アップグレードガイド

## ⚠️ 現在のNode.jsバージョン: v20.19.6
## 🎯 必要なバージョン: v22.x

プロジェクトはNode.js 22用に最適化されていますが、現在Node.js 20を使用しています。
以下の手順でNode.js 22にアップグレードしてください。

## 📋 アップグレード手順

### Windows環境

#### オプション1: Node.jsインストーラー（推奨）

1. **Node.js 22 LTSをダウンロード**
   - https://nodejs.org/ja にアクセス
   - 「LTS」バージョン（推奨版）をダウンロード
   - インストーラーを実行

2. **インストール確認**
```powershell
node --version  # v22.x.x が表示されればOK
npm --version   # v10.9.0以上が表示されればOK
```

3. **プロジェクトの再インストール**
```powershell
cd "C:\Users\Satoshi Niina\OneDrive\Desktop\system\Total Maintenance Control\railway-maintenance-system"
npm run install:all
```

#### オプション2: nvm-windows（複数バージョン管理）

1. **nvm-windowsをインストール**
   - https://github.com/coreybutler/nvm-windows/releases
   - `nvm-setup.exe` をダウンロードして実行

2. **Node.js 22をインストール**
```powershell
# Node.js 22 LTSをインストール
nvm install 22

# Node.js 22を使用
nvm use 22

# 確認
node --version
```

3. **プロジェクトの再インストール**
```powershell
npm run install:all
```

#### オプション3: Chocolatey

```powershell
# 管理者権限でPowerShellを開く
choco install nodejs-lts --version=22.12.0

# 確認
node --version
```

### macOS/Linux環境

#### nvm（推奨）

```bash
# nvmがない場合はインストール
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Node.js 22をインストール
nvm install 22
nvm use 22
nvm alias default 22

# 確認
node --version
```

#### Homebrew（macOS）

```bash
brew install node@22
brew link node@22
```

## 🚀 アップグレード後の確認

### 1. バージョン確認
```powershell
node --version   # v22.12.0以上
npm --version    # v10.9.0以上
```

### 2. プロジェクトのクリーンインストール
```powershell
# node_modulesを削除
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client/node_modules
Remove-Item -Recurse -Force server/node_modules

# package-lock.jsonを削除
Remove-Item -Force package-lock.json
Remove-Item -Force client/package-lock.json
Remove-Item -Force server/package-lock.json

# 再インストール
npm run install:all
```

### 3. 開発サーバー起動テスト
```powershell
# Turbopack開発サーバー
npm run dev
```

### 4. ビルドテスト
```powershell
npm run build
```

## 🎯 Node.js 22の新機能

アップグレード後に使用できる機能：

### 1. 型削除（Type Stripping）
```bash
# TypeScriptをビルドなしで実行
node --experimental-strip-types server.ts
```

### 2. Watch Mode
```bash
# ファイル変更を自動検知
node --watch server.js
```

### 3. パフォーマンス向上
- V8エンジンの最新バージョン
- メモリ管理の改善
- 起動速度の向上

### 4. ESMの完全サポート
- Top-level await
- Import Attributes
- より高速なモジュール解決

## 🐛 トラブルシューティング

### 問題1: インストールエラー

```powershell
# npmキャッシュをクリア
npm cache clean --force

# 再インストール
npm run install:all
```

### 問題2: 権限エラー（Windows）

```powershell
# PowerShellを管理者権限で実行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 問題3: ネイティブモジュールのエラー

```powershell
# node-gypを再インストール
npm install -g node-gyp

# ネイティブモジュールを再ビルド
npm rebuild
```

### 問題4: PATH設定

Node.jsのインストール後、PATHが正しく設定されているか確認：

```powershell
# 環境変数を確認
$env:PATH -split ';' | Select-String "nodejs"
```

PATHに含まれていない場合：
1. システム環境変数を開く
2. `Path`変数に `C:\Program Files\nodejs` を追加
3. PowerShellを再起動

## ✅ 完了確認チェックリスト

- [ ] Node.js 22.x以上がインストールされている
- [ ] npm 10.9.0以上がインストールされている
- [ ] `npm run install:all` が警告なしで完了
- [ ] `npm run dev` で開発サーバーが起動
- [ ] `npm run build` がエラーなしで完了
- [ ] ブラウザで http://localhost:3000 にアクセス可能

## 📚 参考情報

- [Node.js 22 Release Notes](https://nodejs.org/en/blog/release/v22.0.0)
- [nvm-windows](https://github.com/coreybutler/nvm-windows)
- [Node.js ダウンロード](https://nodejs.org/ja)

## 💡 推奨事項

1. **LTSバージョンを使用**
   - Node.js 22 LTSは長期サポート
   - 安定性とセキュリティが保証

2. **nvmを使用**
   - 複数バージョンの管理が簡単
   - プロジェクトごとに切り替え可能

3. **定期的な更新**
   - セキュリティパッチの適用
   - パフォーマンス向上

## 🎉 アップグレード後

Node.js 22にアップグレードしたら、以下のコマンドで最適化された開発体験を：

```powershell
# Turbopack開発サーバー（超高速）
npm run dev

# 型チェック
npm run type-check

# Lint
npm run lint
```

プロジェクトはNode.js 22の最新機能を最大限活用するように設定されています！
