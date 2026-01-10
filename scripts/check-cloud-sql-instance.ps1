# Cloud SQLインスタンス確認スクリプト
# 
# GCPコンソールでCloud SQLインスタンス接続名を確認してください：
# 1. https://console.cloud.google.com/sql/instances にアクセス
# 2. プロジェクト「maint-vehicle-management」を選択
# 3. 対象のCloud SQLインスタンスをクリック
# 4. 「概要」タブで「インスタンス接続名」を確認
#    形式: project:region:instance (例: maint-vehicle-management:asia-northeast1:my-db-instance)
#
# インスタンス接続名を見つけたら、以下のコマンドでCloud SQL Proxyを起動してください：
# .\cloud-sql-proxy.exe "インスタンス接続名" --port 55432
#
# 例：
# .\cloud-sql-proxy.exe "maint-vehicle-management:asia-northeast1:my-db-instance" --port 55432

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Cloud SQL インスタンス接続名の確認方法" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. GCPコンソールにアクセス:" -ForegroundColor Yellow
Write-Host "   https://console.cloud.google.com/sql/instances" -ForegroundColor White
Write-Host ""
Write-Host "2. プロジェクトを選択:" -ForegroundColor Yellow
Write-Host "   maint-vehicle-management" -ForegroundColor White
Write-Host ""
Write-Host "3. Cloud SQLインスタンスをクリック" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. 「概要」タブで「インスタンス接続名」を確認" -ForegroundColor Yellow
Write-Host "   形式: project:region:instance" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "インスタンス接続名が見つかったら、以下のコマンドを実行してください:" -ForegroundColor Green
Write-Host ""
Write-Host ".\cloud-sql-proxy.exe `"インスタンス接続名`" --port 55432" -ForegroundColor Yellow
Write-Host ""
Write-Host "例:" -ForegroundColor Green
Write-Host ".\cloud-sql-proxy.exe `"maint-vehicle-management:asia-northeast1:my-db-instance`" --port 55432" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 試したインスタンス名の候補
$tried_instances = @(
    "maint-vehicle-management:asia-northeast1:webappdb",
    "maint-vehicle-management:asia-northeast1:railway-db"
)

Write-Host "既に試したインスタンス名（存在しませんでした）:" -ForegroundColor Red
foreach ($instance in $tried_instances) {
    Write-Host "  ❌ $instance" -ForegroundColor Red
}
Write-Host ""

# 一般的な候補を提案
Write-Host "試してみる価値のある候補:" -ForegroundColor Cyan
$candidates = @(
    "maint-vehicle-management:asia-northeast1:railway-maintenance-db",
    "maint-vehicle-management:asia-northeast1:postgres-instance",
    "maint-vehicle-management:asia-northeast1:railway-webapp-db",
    "maint-vehicle-management:us-central1:webappdb"
)

foreach ($candidate in $candidates) {
    Write-Host "  💡 $candidate" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
