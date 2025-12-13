# Azure デプロイガイド

## 📋 概要

このプロジェクトをMicrosoft Azureにデプロイする手順です。

---

## 🏗️ Azure リソース構成

```
┌─────────────────────────────────────────────────────┐
│                    Azure Cloud                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐      ┌──────────────────┐   │
│  │ Static Web Apps  │ ───► │  App Service     │   │
│  │  (Next.js)       │ API  │  (Express)       │   │
│  │  Port: 443       │      │  Port: 443/3001  │   │
│  └──────────────────┘      └──────────────────┘   │
│          │                          │              │
│          │                          ▼              │
│          │                 ┌─────────────────┐    │
│          │                 │  PostgreSQL     │    │
│          │                 │  Flexible Server│    │
│          │                 └─────────────────┘    │
│          │                                         │
│          ▼                                         │
│  ┌──────────────────┐                             │
│  │  Blob Storage    │                             │
│  │  (Files)         │                             │
│  └──────────────────┘                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 デプロイ手順

### Phase 1: Azureリソースの準備

#### 1. Azure ポータルにログイン
- https://portal.azure.com/

#### 2. リソースグループの作成
```bash
az group create \
  --name railway-maintenance-rg \
  --location japaneast
```

#### 3. Azure Database for PostgreSQL の作成
```bash
az postgres flexible-server create \
  --resource-group railway-maintenance-rg \
  --name railway-db-server \
  --location japaneast \
  --admin-user dbadmin \
  --admin-password <your-secure-password> \
  --sku-name Standard_B2s \
  --version 15 \
  --storage-size 32 \
  --public-access 0.0.0.0
```

#### 4. データベースの作成
```bash
az postgres flexible-server db create \
  --resource-group railway-maintenance-rg \
  --server-name railway-db-server \
  --database-name railway_maintenance
```

#### 5. Azure App Service Plan の作成
```bash
az appservice plan create \
  --resource-group railway-maintenance-rg \
  --name railway-app-plan \
  --location japaneast \
  --sku B1 \
  --is-linux
```

#### 6. App Service の作成（Server用）
```bash
az webapp create \
  --resource-group railway-maintenance-rg \
  --plan railway-app-plan \
  --name railway-api-server \
  --runtime "NODE:22-lts"
```

#### 7. Static Web App の作成（Client用）
```bash
az staticwebapp create \
  --resource-group railway-maintenance-rg \
  --name railway-client \
  --location japaneast
```

---

### Phase 2: 環境変数の設定

#### App Service（Server）の環境変数
```bash
az webapp config appsettings set \
  --resource-group railway-maintenance-rg \
  --name railway-api-server \
  --settings \
    NODE_ENV=production \
    PORT=3001 \
    DATABASE_URL="postgresql://dbadmin:<password>@railway-db-server.postgres.database.azure.com:5432/railway_maintenance?ssl=true" \
    CORS_ORIGIN="https://railway-client.azurestaticapps.net"
```

#### Static Web Apps（Client）の環境変数
Azure ポータルで設定:
1. Static Web Apps → Configuration
2. Application settings に追加:
```
NEXT_PUBLIC_APP_URL=https://railway-client.azurestaticapps.net
NEXT_PUBLIC_SERVER_URL=https://railway-api-server.azurewebsites.net
```

---

### Phase 3: GitHub Actions の設定

#### 1. Server用ワークフロー作成

`.github/workflows/azure-deploy-server.yml`:
```yaml
name: Azure Server Deployment

on:
  push:
    branches:
      - main
    paths:
      - 'server/**'
      - '.github/workflows/azure-deploy-server.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: |
          cd server
          npm ci --production
      
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: railway-api-server
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./server
```

#### 2. Client用ワークフロー作成

`.github/workflows/azure-deploy-client.yml`:
```yaml
name: Azure Client Deployment

on:
  push:
    branches:
      - main
    paths:
      - 'client/**'
      - '.github/workflows/azure-deploy-client.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: |
          cd client
          npm ci
      
      - name: Build
        env:
          NEXT_PUBLIC_APP_URL: https://railway-client.azurestaticapps.net
          NEXT_PUBLIC_SERVER_URL: https://railway-api-server.azurewebsites.net
        run: |
          cd client
          npm run build
      
      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/client"
          output_location: ".next"
```

---

### Phase 4: GitHub Secrets の設定

リポジトリの Settings → Secrets and variables → Actions で追加:

#### 1. Azure App Service の発行プロファイル
```bash
# Azure ポータルでダウンロード
az webapp deployment list-publishing-profiles \
  --resource-group railway-maintenance-rg \
  --name railway-api-server \
  --xml
```
→ `AZURE_WEBAPP_PUBLISH_PROFILE` として登録

#### 2. Static Web Apps の APIトークン
Azure ポータル → Static Web Apps → Manage deployment token
→ `AZURE_STATIC_WEB_APPS_API_TOKEN` として登録

---

### Phase 5: データベースセットアップ

#### 1. ローカルからデータベースに接続
```bash
# Azure PostgreSQL へのアクセス許可（自分のIPアドレス）
az postgres flexible-server firewall-rule create \
  --resource-group railway-maintenance-rg \
  --name railway-db-server \
  --rule-name AllowMyIP \
  --start-ip-address <your-ip> \
  --end-ip-address <your-ip>
```

#### 2. テーブル作成
```bash
# 接続文字列を環境変数に設定
export DATABASE_URL="postgresql://dbadmin:<password>@railway-db-server.postgres.database.azure.com:5432/railway_maintenance?ssl=true"

# セットアップスクリプト実行
node scripts/setup-database.js
```

---

## 🔐 セキュリティ設定

### 1. Key Vault の作成（推奨）
```bash
az keyvault create \
  --resource-group railway-maintenance-rg \
  --name railway-keyvault \
  --location japaneast
```

### 2. 秘密情報の保存
```bash
# データベースパスワード
az keyvault secret set \
  --vault-name railway-keyvault \
  --name database-password \
  --value "<your-secure-password>"

# App Service から Key Vault への参照
az webapp config appsettings set \
  --resource-group railway-maintenance-rg \
  --name railway-api-server \
  --settings \
    DATABASE_PASSWORD="@Microsoft.KeyVault(SecretUri=https://railway-keyvault.vault.azure.net/secrets/database-password/)"
```

### 3. マネージドID の有効化
```bash
az webapp identity assign \
  --resource-group railway-maintenance-rg \
  --name railway-api-server

# Key Vault アクセス許可
az keyvault set-policy \
  --name railway-keyvault \
  --object-id <managed-identity-object-id> \
  --secret-permissions get list
```

---

## 📊 監視とログ

### Application Insights の有効化
```bash
# Application Insights の作成
az monitor app-insights component create \
  --resource-group railway-maintenance-rg \
  --app railway-insights \
  --location japaneast \
  --application-type web

# App Service に接続
az webapp config appsettings set \
  --resource-group railway-maintenance-rg \
  --name railway-api-server \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="<connection-string>"
```

### ログストリーミング
```bash
# リアルタイムログ表示
az webapp log tail \
  --resource-group railway-maintenance-rg \
  --name railway-api-server
```

---

## 🔄 CI/CD パイプライン

### デプロイフロー
```
1. main ブランチに Push
   ↓
2. GitHub Actions トリガー
   ↓
3. ビルド & テスト
   ↓
4. Azure へデプロイ
   ↓
5. ヘルスチェック
   ↓
6. 完了通知
```

---

## 💰 コスト見積もり（月額）

| サービス | SKU | 概算コスト（円） |
|---------|-----|----------------|
| App Service | B1 (Basic) | ¥2,000 |
| Static Web Apps | Free | ¥0 |
| PostgreSQL | B2s (2vCore) | ¥6,000 |
| Blob Storage | Standard | ¥500 |
| Application Insights | Basic | ¥1,000 |
| **合計** | | **約¥9,500/月** |

※ 実際のコストはトラフィック量により変動

---

## 🛠 トラブルシューティング

### デプロイが失敗する
```bash
# App Service のログ確認
az webapp log download \
  --resource-group railway-maintenance-rg \
  --name railway-api-server

# デプロイ履歴確認
az webapp deployment list \
  --resource-group railway-maintenance-rg \
  --name railway-api-server
```

### データベースに接続できない
```bash
# ファイアウォールルール確認
az postgres flexible-server firewall-rule list \
  --resource-group railway-maintenance-rg \
  --name railway-db-server

# App Service の送信IPアドレスを許可
az webapp show \
  --resource-group railway-maintenance-rg \
  --name railway-api-server \
  --query outboundIpAddresses
```

### 環境変数が反映されない
```bash
# 設定確認
az webapp config appsettings list \
  --resource-group railway-maintenance-rg \
  --name railway-api-server

# アプリケーション再起動
az webapp restart \
  --resource-group railway-maintenance-rg \
  --name railway-api-server
```

---

## 📚 参考リンク

- [Azure App Service Documentation](https://learn.microsoft.com/azure/app-service/)
- [Azure Static Web Apps Documentation](https://learn.microsoft.com/azure/static-web-apps/)
- [Azure Database for PostgreSQL](https://learn.microsoft.com/azure/postgresql/)
- [Azure CLI Reference](https://learn.microsoft.com/cli/azure/)

---

## 🎯 次のステップ

1. ✅ Azure リソースの作成
2. ✅ GitHub Actions の設定
3. ✅ 環境変数の設定
4. ✅ データベースのセットアップ
5. 🔄 初回デプロイ実行
6. 🔄 ドメインの設定（カスタムドメイン使用の場合）
7. 🔄 SSL証明書の設定
8. 🔄 監視アラートの設定

---

**最終更新**: 2025年12月11日
