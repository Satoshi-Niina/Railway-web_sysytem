# Cloud SQL インスタンス名を自動テストするスクリプト

$candidates = @(
    "maint-vehicle-management:asia-northeast1:railway-maintenance-db",
    "maint-vehicle-management:asia-northeast1:postgres-instance",
    "maint-vehicle-management:asia-northeast1:railway-webapp-db",
    "maint-vehicle-management:us-central1:webappdb",
    "maint-vehicle-management:asia-northeast1:railway-maintenance-system",
    "maint-vehicle-management:asia-northeast1:maint-db"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Cloud SQL インスタンス名を自動テスト中..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

foreach ($instance in $candidates) {
    Write-Host "テスト中: $instance" -ForegroundColor Yellow
    
    # Cloud SQL Proxyを一時的に起動
    $process = Start-Process -FilePath ".\cloud-sql-proxy.exe" -ArgumentList "$instance --port 55433" -NoNewWindow -PassThru
    
    # 接続を待つ
    Start-Sleep -Seconds 5
    
    # ポートへの接続テスト
    $result = Test-NetConnection -ComputerName localhost -Port 55433 -WarningAction SilentlyContinue
    
    # プロセスを停止
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    
    if ($result.TcpTestSucceeded) {
        Write-Host "✅ 成功！ インスタンスが見つかりました: $instance" -ForegroundColor Green
        Write-Host ""
        Write-Host "このインスタンス名を使用してCloud SQL Proxyを起動してください:" -ForegroundColor Green
        Write-Host ".\cloud-sql-proxy.exe `"$instance`" --port 55432" -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "❌ 失敗: インスタンスが存在しません" -ForegroundColor Red
    }
    
    Write-Host ""- 
    Start-Sleep -Seconds 2
}

Write-Host "============================================" -ForegroundColor Red
Write-Host "  すべての候補で失敗しました" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host ""
Write-Host "GCPコンソールで正しいインスタンス接続名を確認してください:" -ForegroundColor Yellow
Write-Host "https://console.cloud.google.com/sql/instances" -ForegroundColor White
