# 🚀 AWS デプロイメントガイド

## 📋 AWS サービス構成

### 🏗️ アーキテクチャ概要

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Route 53      │    │   CloudFront    │    │   Application   │
│   (DNS)         │───▶│   (CDN)         │───▶│   Load Balancer │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   S3            │    │   RDS           │    │   ECS Fargate   │
│   (Storage)     │◀───│   (Database)    │◀───│   (Application) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 AWS サービス詳細

### 1. **ECS Fargate** - アプリケーションコンテナ
```yaml
# フロントエンド + バックエンド統合コンテナ
- Next.js アプリケーション (ポート 3000)
- Express.js サーバー (ポート 3001)
- Nginx リバースプロキシ
```

### 2. **RDS PostgreSQL** - データベース
```sql
-- 外部PostgreSQLデータベース
- スキーマ: railway_maintenance
- ユーザー: railway_user
- 接続: SSL暗号化
```

### 3. **S3** - ファイルストレージ
```bash
# 相対パスでの接続
- バケット名: railway-maintenance-storage
- アクセス: IAMロール経由
- パス: /uploads/, /reports/, /backups/
```

### 4. **CloudFront** - CDN
```yaml
# 静的ファイル配信
- オリジン: S3 + ALB
- キャッシュ: 静的ファイル
- HTTPS: 強制
```

## 🚀 デプロイ手順

### 1. **AWS インフラの準備**

#### VPC とネットワーク
```bash
# VPC作成
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region ap-northeast-1

# サブネット作成
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.0.1.0/24 --availability-zone ap-northeast-1a

# セキュリティグループ作成
aws ec2 create-security-group --group-name railway-maintenance-sg --description "Railway Maintenance Security Group" --vpc-id vpc-12345678
```

#### RDS PostgreSQL データベース
```bash
# RDSインスタンス作成
aws rds create-db-instance \
  --db-instance-identifier railway-maintenance-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username railway_user \
  --master-user-password secure_password \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-12345678 \
  --db-subnet-group-name railway-maintenance-subnet-group
```

#### S3 バケット
```bash
# S3バケット作成
aws s3 mb s3://railway-maintenance-storage --region ap-northeast-1

# バケットポリシー設定
aws s3api put-bucket-policy --bucket railway-maintenance-storage --policy file://aws/s3-bucket-policy.json
```

### 2. **ECS デプロイ**

#### ECR リポジトリ作成
```bash
# ECRリポジトリ作成
aws ecr create-repository --repository-name railway-maintenance-system --region ap-northeast-1
```

#### Docker イメージプッシュ
```bash
# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com

# イメージビルド・プッシュ
docker build -t railway-maintenance-system .
docker tag railway-maintenance-system:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/railway-maintenance-system:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/railway-maintenance-system:latest
```

#### ECS サービス作成
```bash
# タスク定義登録
aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json

# サービス作成
aws ecs create-service \
  --cluster railway-maintenance-cluster \
  --service-name railway-maintenance-service \
  --task-definition railway-maintenance-system \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678],securityGroups=[sg-12345678],assignPublicIp=ENABLED}"
```

### 3. **データベースセットアップ**

#### スキーマとデータのインポート
```bash
# ECSタスク内で実行
aws ecs run-task \
  --cluster railway-maintenance-cluster \
  --task-definition railway-maintenance-system \
  --overrides '{"containerOverrides":[{"name":"railway-maintenance-app","command":["node","scripts/setup-database.js"]}]}'

aws ecs run-task \
  --cluster railway-maintenance-cluster \
  --task-definition railway-maintenance-system \
  --overrides '{"containerOverrides":[{"name":"railway-maintenance-app","command":["node","scripts/setup-master-tables.js"]}]}'
```

## 🔒 セキュリティ設定

### 1. **IAM ロールとポリシー**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::railway-maintenance-storage/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:ap-northeast-1:*:secret:railway-maintenance/*"
    }
  ]
}
```

### 2. **Secrets Manager**
```bash
# 機密情報の保存
aws secretsmanager create-secret \
  --name railway-maintenance/database-url \
  --secret-string "postgresql://username:password@your-rds-endpoint:5432/railway_maintenance"

aws secretsmanager create-secret \
  --name railway-maintenance/supabase-url \
  --secret-string "https://your-supabase-url.supabase.co"
```

## 📊 監視とログ

### 1. **CloudWatch ログ**
```yaml
# ECSタスク定義で設定
logConfiguration:
  logDriver: "awslogs"
  options:
    awslogs-group: "/ecs/railway-maintenance-system"
    awslogs-region: "ap-northeast-1"
    awslogs-stream-prefix: "ecs"
```

### 2. **CloudWatch メトリクス**
```bash
# カスタムメトリクス送信
aws cloudwatch put-metric-data \
  --namespace "RailwayMaintenance" \
  --metric-data MetricName=DatabaseConnections,Value=10,Unit=Count
```

## 🔄 CI/CD パイプライン

### GitHub Actions ワークフロー
```yaml
# .github/workflows/deploy-aws.yml
name: Deploy to AWS ECS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      - name: Build and push Docker image
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.ap-northeast-1.amazonaws.com
          docker build -t railway-maintenance-system .
          docker tag railway-maintenance-system:latest ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.ap-northeast-1.amazonaws.com/railway-maintenance-system:latest
          docker push ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.ap-northeast-1.amazonaws.com/railway-maintenance-system:latest
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster railway-maintenance-cluster --service railway-maintenance-service --force-new-deployment
```

## 💰 コスト最適化

### 1. **リソース設定**
```yaml
# ECS Fargate
cpu: "512"      # 0.5 vCPU
memory: "1024"  # 1GB RAM

# RDS
db-instance-class: db.t3.micro  # 最小インスタンス
allocated-storage: 20           # 最小ストレージ
```

### 2. **自動スケーリング**
```bash
# ECS サービス自動スケーリング
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/railway-maintenance-cluster/railway-maintenance-service \
  --min-capacity 1 \
  --max-capacity 3
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. **ECS タスク起動失敗**
```bash
# タスクログ確認
aws logs get-log-events \
  --log-group-name /ecs/railway-maintenance-system \
  --log-stream-name ecs/railway-maintenance-app/タスクID
```

#### 2. **データベース接続エラー**
```bash
# RDS接続テスト
aws rds describe-db-instances --db-instance-identifier railway-maintenance-db
```

#### 3. **S3 アクセスエラー**
```bash
# IAMロール確認
aws iam get-role --role-name ecsTaskRole
aws iam list-attached-role-policies --role-name ecsTaskRole
``` 