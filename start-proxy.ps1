# Cloud SQL Proxy起動スクリプト（シンプル版）

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Cloud SQL Proxy を起動します" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$instanceName = "maint-vehicle-management:asia-northeast2:free-trial-first-project"

Write-Host "インスタンス: $instanceName" -ForegroundColor White
Write-Host "ポート: 55432" -ForegroundColor White
Write-Host ""
Write-Host "このウィンドウは開いたままにしてください" -ForegroundColor Yellow
Write-Host "停止するには Ctrl+C を押してください" -ForegroundColor Yellow
Write-Host ""

& ".\cloud-sql-proxy.exe" "$instanceName" --address 127.0.0.1 --port 55432
