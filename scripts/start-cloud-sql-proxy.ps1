# Cloud SQL Auth Proxy を開始するためのスクリプト
# 使い方: .\scripts\start-cloud-sql-proxy.ps1 -InstanceConnectionName "your-project:region:your-instance"

param (
    [string]$InstanceConnectionName = "",
    [int]$Port = 5432
)

# プロキシの実行ファイル名
$ProxyExe = "cloud-sql-proxy.exe"

# 実行ファイルが存在しない場合はダウンロードを案内
if (!(Test-Path $ProxyExe)) {
    Write-Host "Cloud SQL Auth Proxy ($ProxyExe) が見つかりません。" -ForegroundColor Yellow
    Write-Host "ダウンロード中..." -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.2/cloud-sql-proxy.x64.exe -OutFile $ProxyExe
        Write-Host "ダウンロード完了。" -ForegroundColor Green
    } catch {
        Write-Host "ダウンロードに失敗しました。手動で $ProxyExe を配置してください。" -ForegroundColor Red
        return
    }
}

if ($InstanceConnectionName -eq "") {
    Write-Host "エラー: インスタンス接続名を指定してください。" -ForegroundColor Red
    Write-Host "例: .\scripts\start-cloud-sql-proxy.ps1 -InstanceConnectionName `"project:region:instance`"" -ForegroundColor Cyan
    return
}

Write-Host "Cloud SQL Auth Proxy を開始します..." -ForegroundColor Green
Write-Host "Instance: $InstanceConnectionName" -ForegroundColor Cyan
Write-Host "Local Port: $Port" -ForegroundColor Cyan
Write-Host "中止するには Ctrl+C を押してください。" -ForegroundColor Gray

& ".\$ProxyExe" "$InstanceConnectionName" --port $Port
