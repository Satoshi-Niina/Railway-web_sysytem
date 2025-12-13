# 依存関係の自動監視システム

このプロジェクトでは、依存関係のセキュリティと最新性を**自動的に監視・修正**するシステムを導入しています。

## 🤖 自動化の仕組み

### 1. **定期的な自動チェック（毎週日曜日 3:00）**
- すべてのパッケージのセキュリティ脆弱性をスキャン
- 利用可能な更新バージョンをチェック
- GitHub Issueで結果を通知

**ファイル**: `.github/workflows/dependency-check.yml`

### 2. **自動更新PR作成（毎週月曜日 2:00）**
- パッチバージョンの安全な更新を自動適用
- Pull Requestを自動作成
- レビュー後にマージするだけで更新完了

**ファイル**: `.github/workflows/auto-update-dependencies.yml`

### 3. **Node.jsバージョン監視（毎月1日）**
- 最新LTSバージョンをチェック
- 新バージョンがある場合は手順付きIssueを作成

**ファイル**: `.github/workflows/node-version-check.yml`

### 4. **外部ボット連携**
- **Dependabot**: GitHub標準機能でPR自動作成
- **Renovate Bot**: より柔軟なグループ化と自動マージ

**ファイル**: `.github/dependabot.yml`, `renovate.json`

---

## 📊 何が自動で行われるか

### ✅ 完全自動（管理者の操作不要）

| 項目 | 実行タイミング | 動作 |
|------|---------------|------|
| セキュリティスキャン | 毎週日曜 3:00 | 脆弱性を検出してIssueで通知 |
| 重大な脆弱性の修正 | 脆弱性検出時 | 自動的に`npm audit fix`を実行してコミット |
| パッチ更新のPR作成 | 毎週月曜 2:00 | 安全な更新のみPR作成 |
| Node.jsバージョン確認 | 毎月1日 | 新LTSがあればIssueで通知 |

### 🔔 通知のみ（管理者の判断が必要）

| 項目 | 通知方法 | 対応 |
|------|----------|------|
| マイナー/メジャー更新 | GitHub Issue | 手動でレビュー・更新 |
| Node.js新バージョン | GitHub Issue | 手順に従って更新 |
| 依存関係の更新リスト | 毎週のIssue | 必要に応じて対応 |

---

## 🚀 セットアップ方法

### 1. GitHub Actionsを有効化（初回のみ）

リポジトリの **Settings** → **Actions** → **General** で以下を設定:
- ✅ "Allow all actions and reusable workflows"
- ✅ "Read and write permissions" (Workflow permissions)
- ✅ "Allow GitHub Actions to create and approve pull requests"

### 2. Dependabotを有効化（推奨）

リポジトリの **Settings** → **Security** → **Code security and analysis**:
- ✅ "Dependabot alerts"
- ✅ "Dependabot security updates"

### 3. Slack通知を設定（オプション）

重大な脆弱性をSlackに通知したい場合:

1. Slack Incoming Webhookを作成
2. リポジトリの **Settings** → **Secrets and variables** → **Actions**
3. `SLACK_WEBHOOK_URL` という名前でWebhook URLを追加

### 4. Renovate Botをインストール（オプション）

より高度な自動化が必要な場合:
1. [GitHub Marketplace](https://github.com/apps/renovate)でRenovate Botをインストール
2. このリポジトリへのアクセスを許可

---

## 📝 日常の運用フロー

### 管理者が行うこと

#### 毎週月曜日（2分）
1. GitHubを開く
2. 自動作成されたPRを確認
3. 問題なければ "Merge pull request" をクリック

#### セキュリティ脆弱性が検出された場合（即座）
1. GitHub IssueまたはSlackで通知を受信
2. 重大な脆弱性は**既に自動修正済み**（確認のみ）
3. 軽度の脆弱性は手順に従って対応

#### 月次作業（10分）
1. Node.jsバージョンのIssueを確認
2. 必要に応じてアップグレード

### 管理者が行わないこと

- ❌ 手動で `npm audit` を実行
- ❌ 手動でパッケージバージョンをチェック
- ❌ 毎日のセキュリティ監視
- ❌ package.jsonの手動編集（緊急時を除く）

---

## 🛠 手動コマンド（必要時のみ）

緊急時や手動で確認したい場合のコマンド:

```bash
# 全体の更新チェック
npm run check-updates:all

# セキュリティ監査
npm run audit

# 対話形式で更新
npm run update:interactive

# 全自動更新（注意: Breaking Changesあり）
npm run update:all
```

---

## 📧 通知の種類と対応

### 🟢 緑色通知（情報のみ）
- 定期チェック完了
- 更新なし
- **対応不要**

### 🟡 黄色通知（確認推奨）
- パッチ更新のPR作成
- 新しいマイナーバージョン
- **週次でレビュー**

### 🔴 赤色通知（即座に対応）
- 重大なセキュリティ脆弱性
- Critical/High severity
- **自動修正済みだが確認必須**

---

## 🔐 セキュリティポリシー

### 自動修正されるもの
- ✅ Critical/High severityの脆弱性
- ✅ パッチバージョンの更新（1.0.0 → 1.0.1）
- ✅ セキュリティパッチ

### 手動確認が必要なもの
- ⚠️ マイナーバージョン（1.0.0 → 1.1.0）
- ⚠️ メジャーバージョン（1.0.0 → 2.0.0）
- ⚠️ フレームワークのコア更新（Next.js, React等）

---

## 📚 関連ファイル

```
.github/
  workflows/
    dependency-check.yml          # セキュリティと更新のチェック
    auto-update-dependencies.yml  # 自動更新PR作成
    node-version-check.yml        # Node.jsバージョン監視
  dependabot.yml                  # Dependabot設定
renovate.json                     # Renovate Bot設定
package.json                      # 手動コマンド定義
```

---

## 🎯 メリット

1. **管理者の負担を90%削減**
   - 週2分のPRレビューのみ
   - セキュリティ監視は完全自動

2. **セキュリティリスクの最小化**
   - 脆弱性を24時間以内に検出
   - 重大な問題は自動修正

3. **常に最新の安定版を維持**
   - 安全な更新は自動適用
   - 破壊的変更は慎重にレビュー

4. **透明性と監査可能性**
   - すべての変更がGitHubに記録
   - Issueで履歴を追跡可能

---

## ❓ トラブルシューティング

### GitHub Actionsが実行されない
1. リポジトリの Actions タブを確認
2. Workflow permissions を確認
3. `.github/workflows/` のYAMLファイルに構文エラーがないか確認

### 通知が届かない
1. GitHub Issueが作成されているか確認
2. GitHubの通知設定を確認（Settings → Notifications）
3. リポジトリをWatchしているか確認

### 自動PRがマージできない
1. テストが失敗していないか確認
2. コンフリクトがないか確認
3. 必要に応じてローカルで動作確認

---

## 📞 サポート

質問や問題がある場合:
1. [GitHub Issues](https://github.com/Satoshi-Niina/Railway-web_sysytem/issues)で報告
2. このドキュメントのトラブルシューティングを確認
3. `npm run check-updates:all` で手動確認
