# Google Cloud Storage (GCS) セットアップガイド

このプロジェクトではファイルストレージとしてGoogle Cloud Storageを使用します。

## 必要な設定

### 1. GCPプロジェクトの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクト「maint-vehicle-management」を選択
3. Cloud Storage APIが有効になっていることを確認

### 2. サービスアカウントの作成

1. IAMと管理 > サービスアカウント に移動
2. 「サービスアカウントを作成」をクリック
3. 必要な権限を付与:
   - `Storage Object Admin` (ストレージオブジェクトの作成・削除・更新)
   - または `Storage Admin` (バケット管理も含む)
4. キーを作成（JSON形式）
5. ダウンロードしたJSONファイルを以下のように配置:
   - 開発環境: `./gcp-service-account-key.json`
   - 本番環境: `/var/app/gcp-service-account-key.json`

### 3. バケットの作成

```bash
# gcloud CLIを使用する場合
gsutil mb -p maint-vehicle-management -c STANDARD -l asia-northeast1 gs://railway-maintenance-storage/

# フォルダ構造を作成（オプション）
gsutil -m mkdir gs://railway-maintenance-storage/failures/
gsutil -m mkdir gs://railway-maintenance-storage/repairs/
gsutil -m mkdir gs://railway-maintenance-storage/inspections/
gsutil -m mkdir gs://railway-maintenance-storage/documents/
gsutil -m mkdir gs://railway-maintenance-storage/backups/
```

または、Google Cloud Consoleから:
1. Cloud Storage > ブラウザ に移動
2. 「バケットを作成」をクリック
3. バケット名: `railway-maintenance-storage`
4. ロケーションタイプ: Region
5. リージョン: `asia-northeast1` (東京)
6. ストレージクラス: Standard

### 4. 環境変数の設定

#### 開発環境 (server/.env)
```env
STORAGE_TYPE=gcs
GCP_PROJECT_ID=maint-vehicle-management
GCS_BUCKET_NAME=railway-maintenance-storage
GCP_KEY_FILE=./gcp-service-account-key.json
```

#### 本番環境 (server/.env.production)
```env
STORAGE_TYPE=gcs
GCP_PROJECT_ID=maint-vehicle-management
GCS_BUCKET_NAME=railway-maintenance-storage
GCP_KEY_FILE=/var/app/gcp-service-account-key.json
```

### 5. 公開アクセスの設定（オプション）

アップロードしたファイルを公開URLで直接アクセスしたい場合:

```bash
# バケット全体を公開読み取り可能にする
gsutil iam ch allUsers:objectViewer gs://railway-maintenance-storage

# または、特定のフォルダのみ公開
gsutil iam ch allUsers:objectViewer gs://railway-maintenance-storage/inspections/
```

⚠️ セキュリティ上の注意: 機密情報を含むファイルは公開しないでください。

### 6. CORS設定（Next.jsから直接アップロードする場合）

```bash
# cors.jsonを作成
cat > cors.json << EOF
[
  {
    "origin": ["http://localhost:3000", "https://your-production-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

# CORSを設定
gsutil cors set cors.json gs://railway-maintenance-storage
```

## 使用方法

### ファイルのアップロード

```typescript
import { uploadFile, STORAGE_FOLDERS } from '@/lib/cloud-storage'

const file = Buffer.from(await file.arrayBuffer())
const fileUrl = await uploadFile(
  file,
  'example.jpg',
  STORAGE_FOLDERS.INSPECTIONS,
  'image/jpeg'
)
// 結果: https://storage.googleapis.com/railway-maintenance-storage/inspections/1234567890-example.jpg
```

### ファイルの削除

```typescript
import { deleteFile } from '@/lib/cloud-storage'

const success = await deleteFile(
  'https://storage.googleapis.com/railway-maintenance-storage/inspections/1234567890-example.jpg'
)
```

### ストレージ使用量の確認

```typescript
import { getStorageUsage } from '@/lib/cloud-storage'

const usage = await getStorageUsage()
console.log(usage)
// {
//   failures: 1024000,
//   repairs: 2048000,
//   inspections: 4096000,
//   documents: 512000,
//   backups: 10240000,
//   total: 17920000
// }
```

## トラブルシューティング

### 認証エラー

```
Error: Could not load the default credentials
```

→ サービスアカウントキーのパスが正しいか確認してください。

### 権限エラー

```
Error: Permission denied
```

→ サービスアカウントに適切な権限（Storage Object Admin）が付与されているか確認してください。

### バケットが見つからない

```
Error: Bucket not found
```

→ バケット名とプロジェクトIDが正しいか確認してください。

## 料金について

- ストレージ: 約 $0.020/GB/月（Standard、asia-northeast1）
- ネットワーク: 東京リージョン内は無料
- オペレーション: Class A（書き込み）$0.05/10,000回、Class B（読み取り）$0.004/10,000回

詳細は[Google Cloud Storage 料金](https://cloud.google.com/storage/pricing)を参照してください。
