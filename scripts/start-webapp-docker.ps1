param([switch]$Rebuild, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Get-Command docker -ErrorAction Stop | Out-Null
Push-Location -LiteralPath $projectRoot
try {
    $composeArgs = @('compose', 'up', '-d', '--wait')
    if ($Rebuild) { $composeArgs += @('--build', '--force-recreate') }
    & docker @composeArgs
    if ($LASTEXITCODE -ne 0) { throw 'Docker gagal menjalankan webapp. Pastikan Docker Desktop aktif dalam mode Linux containers.' }
    $url = 'http://localhost:4173'
    $health = Invoke-RestMethod -Uri "$url/health" -TimeoutSec 5
    if ($health.app -ne 'sentuh-tanahku-local' -or $health.status -ne 'ok') { throw 'Health check webapp Docker belum berhasil.' }
    Write-Output "Webapp Docker siap: $url"
    if (-not $NoBrowser) { Start-Process $url }
} finally { Pop-Location }
