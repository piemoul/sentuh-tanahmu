$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $projectRoot 'environment\webapp.pid'
if (Test-Path -LiteralPath $pidFile) {
    $serverPid = [int](Get-Content -LiteralPath $pidFile)
    $serverProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $serverPid"
    $expectedScript = Join-Path $projectRoot 'webapp\server.mjs'
    if ($serverProcess -and $serverProcess.CommandLine.Contains($expectedScript)) {
        Stop-Process -Id $serverPid
        Write-Output 'Server Sentuh Tanahku lokal dihentikan.'
    } else { Write-Output 'Server yang dicatat sudah tidak berjalan.' }
} else { Write-Output 'Belum ada server lokal yang dicatat.' }
