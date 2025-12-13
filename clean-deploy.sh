#!/bin/bash

###############################################################################
# クリーンデプロイスクリプト
# デプロイ先のキャッシュとビルドファイルを完全にクリアしてからデプロイ
###############################################################################

set -e  # エラーが発生したら即座に終了

echo "=========================================="
echo "クリーンデプロイを開始します"
echo "=========================================="

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ステップ1: ローカルのキャッシュとビルドファイルをクリア
echo -e "${YELLOW}[1/6] ローカルのキャッシュとビルドファイルをクリア中...${NC}"
rm -rf .next client/.next server/dist
rm -rf node_modules/.cache
echo -e "${GREEN}✓ ローカルキャッシュをクリアしました${NC}"

# ステップ2: 依存関係の再インストール
echo -e "${YELLOW}[2/6] 依存関係を再インストール中...${NC}"
npm run install:all
echo -e "${GREEN}✓ 依存関係を再インストールしました${NC}"

# ステップ3: ビルド
echo -e "${YELLOW}[3/6] 本番用ビルドを実行中...${NC}"
npm run build
echo -e "${GREEN}✓ ビルドが完了しました${NC}"

# ステップ4: Gitの状態確認
echo -e "${YELLOW}[4/6] Gitの状態を確認中...${NC}"
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}警告: コミットされていない変更があります${NC}"
  git status --short
  read -p "続行しますか？ (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}デプロイを中止しました${NC}"
    exit 1
  fi
fi
echo -e "${GREEN}✓ Gitの状態を確認しました${NC}"

# ステップ5: mainブランチにプッシュ
echo -e "${YELLOW}[5/6] GitHubにプッシュ中...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "現在のブランチ: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${YELLOW}mainブランチではありません。mainにマージしますか？ (y/n): ${NC}"
  read -p "" -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git checkout main
    git merge $CURRENT_BRANCH
  else
    echo -e "${RED}mainブランチに切り替えてから再実行してください${NC}"
    exit 1
  fi
fi

git push origin main --force-with-lease
echo -e "${GREEN}✓ GitHubにプッシュしました${NC}"

# ステップ6: デプロイ先の指示
echo -e "${YELLOW}[6/6] デプロイ先での作業${NC}"
echo ""
echo "=========================================="
echo "次に、デプロイ先で以下のコマンドを実行してください:"
echo "=========================================="
echo ""
echo "# 1. リポジトリのクリーンアップ"
echo "git fetch origin"
echo "git reset --hard origin/main"
echo "git clean -fdx"
echo ""
echo "# 2. キャッシュのクリア"
echo "rm -rf .next client/.next server/dist node_modules/.cache"
echo ""
echo "# 3. 依存関係の再インストール"
echo "npm run install:all"
echo ""
echo "# 4. 本番用環境変数の設定"
echo "# client/.env.production.local を作成"
echo "# server/.env.production.local を作成"
echo ""
echo "# 5. ビルドとデプロイ"
echo "npm run build"
echo "npm run start"
echo ""
echo "=========================================="
echo -e "${GREEN}クリーンデプロイの準備が完了しました${NC}"
echo "=========================================="
