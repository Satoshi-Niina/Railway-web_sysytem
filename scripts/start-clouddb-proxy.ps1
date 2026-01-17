# Cloud SQL Proxy 起動スクリプト
# ローカル開発環境でCloudDBに接続するためのプロキシを起動します

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Cloud SQL Proxy 起動中..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 既存のCloud SQL Proxyプロセスを確認
$existingProcess = Get-Process -Name "cloud-sql-proxy" -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "⚠️  Cloud SQL Proxyは既に起動しています（PID: $($existingProcess.Id)）" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "再起動しますか？ (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "既存のプロセスを停止中..." -ForegroundColor Yellow
        Stop-Process -Id $existingProcess.Id -Force
        Start-Sleep -Seconds 2
        Write-Host "✅ 停止しました" -ForegroundColor Green
    } else {
        Write-Host "既存のプロセスをそのまま使用します" -ForegroundColor Green
        exit 0
    }
}

# Cloud SQL Proxy実行ファイルの確認
$proxyExe = ".\cloud-sql-proxy.exe"
if (!(Test-Path $proxyExe)) {
    Write-Host "❌ cloud-sql-proxy.exe が見つかりません" -ForegroundColor Red
    Write-Host "   パス: $proxyExe" -ForegroundColor White
    exit 1
}

# 接続情報
$instanceConnectionName = "maint-vehicle-management:asia-northeast2:free-trial-first-project"
$address = "127.0.0.1"
$port = "55432"

Write-Host "📋 接続情報:" -ForegroundColor White
Write-Host "   インスタンス: $instanceConnectionName" -ForegroundColor White
Write-Host "   アドレス: $address" -ForegroundColor White
Write-Host "   ポート: $port" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Cloud SQL Proxyを起動しています..." -ForegroundColor Green
Write-Host ""
Write-Host "✨ このウィンドウは開いたままにしてください" -ForegroundColor Yellow
Write-Host "   停止するには Ctrl+C を押してください" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Cloud SQL Proxyを起動
& $proxyExe "$instanceConnectionName" --address $address --port $port
