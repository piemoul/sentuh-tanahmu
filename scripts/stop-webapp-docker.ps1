$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    & docker compose stop webapp
    if ($LASTEXITCODE -ne 0) { throw 'Container webapp belum berhasil dihentikan.' }
} finally { Pop-Location }
