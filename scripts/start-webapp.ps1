param([int]$Port = 4173, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $projectRoot 'tools\runtime\node.exe'
if (-not (Test-Path -LiteralPath $runtime)) { $runtime = (Get-Command node -ErrorAction Stop).Source }
$url = "http://localhost:$Port"
$running = $false
try {
    $health = Invoke-RestMethod -Uri "$url/health" -TimeoutSec 2
    $running = $health.app -eq 'sentuh-tanahku-local'
} catch { }
if (-not $running) {
    if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { throw "Port $Port sudah digunakan aplikasi lain. Pilih -Port lain." }
    $env:PORT = "$Port"
    $serverPath = Join-Path $projectRoot 'webapp\server.mjs'
    $logPath = Join-Path $projectRoot 'environment\webapp.log'
    $errorPath = Join-Path $projectRoot 'environment\webapp-error.log'
    $process = Start-Process -FilePath $runtime -ArgumentList @('--openssl-legacy-provider', ('"' + $serverPath + '"')) -WorkingDirectory (Join-Path $projectRoot 'webapp') -WindowStyle Hidden -PassThru -RedirectStandardOutput $logPath -RedirectStandardError $errorPath
    $process.Id | Set-Content (Join-Path $projectRoot 'environment\webapp.pid')
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 250
        try { $health = Invoke-RestMethod -Uri "$url/health" -TimeoutSec 1; if ($health.app -eq 'sentuh-tanahku-local') { $running = $true; break } } catch { }
    }
    if (-not $running) { throw "Webapp gagal mulai. Lihat $errorPath" }
}
Write-Output "Sentuh Tanahku lokal siap: $url"
if (-not $NoBrowser) { Start-Process $url }
