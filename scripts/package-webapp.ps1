$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $projectRoot 'deliverables'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
$sourceDirectory = Join-Path $projectRoot 'webapp'
$archive = Join-Path $destination 'sentuh-tanahku-webapp.zip'
Compress-Archive -LiteralPath $sourceDirectory -DestinationPath $archive -Force
Get-FileHash -LiteralPath $archive -Algorithm SHA256
