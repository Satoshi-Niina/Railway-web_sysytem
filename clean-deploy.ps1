# クリーンデプロイスクリプト (PowerShell版)
# デプロイ先のキャッシュとビルドファイルを完全にクリアしてからデプロイ

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "クリーンデプロイを開始します" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# ステップ1: ローカルのキャッシュとビルドファイルをクリア
Write-Host "[1/6] ローカルのキャッシュとビルドファイルをクリア中..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "client\.next") { Remove-Item -Recurse -Force "client\.next" }
if (Test-Path "server\dist") { Remove-Item -Recurse -Force "server\dist" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }
Write-Host "✓ ローカルキャッシュをクリアしました" -ForegroundColor Green

# ステップ2: 依存関係の再インストール
Write-Host "[2/6] 依存関係を再インストール中..." -ForegroundColor Yellow
npm run install:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "エラー: 依存関係のインストールに失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 依存関係を再インストールしました" -ForegroundColor Green

# ステップ3: ビルド
Write-Host "[3/6] 本番用ビルドを実行中..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "エラー: ビルドに失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host "✓ ビルドが完了しました" -ForegroundColor Green

# ステップ4: Gitの状態確認
Write-Host "[4/6] Gitの状態を確認中..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "警告: コミットされていない変更があります" -ForegroundColor Red
    git status --short
    $continue = Read-Host "続行しますか？ (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "デプロイを中止しました" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✓ Gitの状態を確認しました" -ForegroundColor Green

# ステップ5: mainブランチにプッシュ
Write-Host "[5/6] GitHubにプッシュ中..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "現在のブランチ: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -ne "main") {
    Write-Host "mainブランチではありません。mainにマージしますか？ (y/n):" -ForegroundColor Yellow
    $merge = Read-Host
    if ($merge -eq "y" -or $merge -eq "Y") {
        git checkout main
        git merge $currentBranch
    } else {
        Write-Host "mainブランチに切り替えてから再実行してください" -ForegroundColor Red
        exit 1
    }
}

git push origin main --force-with-lease
if ($LASTEXITCODE -ne 0) {
    Write-Host "エラー: プッシュに失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host "✓ GitHubにプッシュしました" -ForegroundColor Green

# ステップ6: デプロイ先の指示
Write-Host "[6/6] デプロイ先での作業" -ForegroundColor Yellow
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "次に、デプロイ先で以下のコマンドを実行してください:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 1. リポジトリのクリーンアップ" -ForegroundColor White
Write-Host "git fetch origin" -ForegroundColor Gray
Write-Host "git reset --hard origin/main" -ForegroundColor Gray
Write-Host "git clean -fdx" -ForegroundColor Gray
Write-Host ""
Write-Host "# 2. キャッシュのクリア" -ForegroundColor White
Write-Host "Remove-Item -Recurse -Force .next, client\.next, server\dist, node_modules\.cache" -ForegroundColor Gray
Write-Host ""
Write-Host "# 3. 依存関係の再インストール" -ForegroundColor White
Write-Host "npm run install:all" -ForegroundColor Gray
Write-Host ""
Write-Host "# 4. 本番用環境変数の設定" -ForegroundColor White
Write-Host "# client/.env.production.local を作成" -ForegroundColor Gray
Write-Host "# server/.env.production.local を作成" -ForegroundColor Gray
Write-Host ""
Write-Host "# 5. ビルドとデプロイ" -ForegroundColor White
Write-Host "npm run build" -ForegroundColor Gray
Write-Host "npm run start" -ForegroundColor Gray
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "クリーンデプロイの準備が完了しました" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
