#!/bin/bash

set -e

echo "🚀 AWS ECS デプロイスクリプト"
echo "============================"

# 環境変数の確認
if [ ! -f .env ]; then
    echo "❌ .env ファイルが見つかりません"
    exit 1
fi

source .env

# AWS設定
AWS_REGION="ap-northeast-1"
ECR_REPOSITORY="railway-maintenance-system"
ECS_CLUSTER="railway-maintenance-cluster"
ECS_SERVICE="railway-maintenance-service"
TASK_DEFINITION="aws/ecs-task-definition.json"

# ECRリポジトリの作成（存在しない場合）
echo "📦 ECRリポジトリを作成中..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION || \
aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION

# ECRログイン
echo "🔐 ECRにログイン中..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com

# Dockerイメージのビルド
echo "🔨 Dockerイメージをビルド中..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --build-arg DATABASE_URL="$DATABASE_URL" \
  --build-arg AWS_REGION="$AWS_REGION" \
  --build-arg AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  --build-arg AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  --build-arg AWS_S3_BUCKET_NAME="$AWS_S3_BUCKET_NAME" \
  -t $ECR_REPOSITORY:latest .

# ECRにプッシュ
echo "📤 ECRにイメージをプッシュ中..."
docker tag $ECR_REPOSITORY:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# ECSクラスターの作成
echo "🏗️ ECSクラスターを作成中..."
aws ecs create-cluster --cluster-name $ECS_CLUSTER --region $AWS_REGION || echo "クラスターは既に存在します"

# タスク定義の更新
echo "📝 タスク定義を更新中..."
aws ecs register-task-definition --cli-input-json file://$TASK_DEFINITION --region $AWS_REGION

# ECSサービスの作成/更新
echo "🚀 ECSサービスを更新中..."
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --task-definition $ECS_CLUSTER \
  --region $AWS_REGION || \
aws ecs create-service \
  --cluster $ECS_CLUSTER \
  --service-name $ECS_SERVICE \
  --task-definition $ECS_CLUSTER \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678],securityGroups=[sg-12345678],assignPublicIp=ENABLED}" \
  --region $AWS_REGION

echo "✅ AWS ECS デプロイ完了！"
echo ""
echo "🌐 アプリケーションURL: $NEXT_PUBLIC_APP_URL"
echo "📊 ECSコンソール: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/$ECS_CLUSTER" 