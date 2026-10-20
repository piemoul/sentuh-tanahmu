#requires -Version 7.0
<# Installs only the unchanged original split set into the owned audit AVD.
   Refuses another AVD, unsupported ABI/API, changed APK hashes or an existing app.
   No replacement/downgrade/permission-grant flags are used. #>
[CmdletBinding()]
param([ValidateSet(30,36)][int]$ApiLevel = 30)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$adbPath = Join-Path $projectRoot 'environment\android\platform-tools\adb.exe'
$reportRoot = Join-Path $projectRoot 'analysis\runtime\emulator'
if ($ApiLevel -eq 36) { $reportRoot = Join-Path $reportRoot 'api36' }
$emulatorSerial = if ($ApiLevel -eq 30) { 'emulator-5580' } else { 'emulator-5582' }
$expectedAvd = "sentuh_audit_api$ApiLevel"
$adbPrefix = @('-P', '5038', '-s', $emulatorSerial)
$env:ADB_MDNS_AUTO_CONNECT = '0'
$avdName = & $adbPath @adbPrefix emu avd name
if ($LASTEXITCODE -ne 0 -or $avdName[0].Trim() -ne $expectedAvd) {
    throw "Target is not the owned $expectedAvd AVD."
}
$boot = (& $adbPath @adbPrefix shell getprop sys.boot_completed).Trim()
$api = (& $adbPath @adbPrefix shell getprop ro.build.version.sdk).Trim()
$abi = (& $adbPath @adbPrefix shell getprop ro.product.cpu.abilist).Trim()
$nativeBridge = (& $adbPath @adbPrefix shell getprop ro.dalvik.vm.native.bridge).Trim()
if ($boot -ne '1') { throw 'Audit AVD is not booted.' }
if ([int]$api -lt 28) { throw 'Android API level does not satisfy minSdkVersion 28.' }
if (($abi -split ',') -notcontains 'arm64-v8a') { throw 'AVD does not expose arm64-v8a support.' }
$existing = & $adbPath @adbPrefix shell pm list packages --show-versioncode id.go.bpn.sentuh
if ($LASTEXITCODE -ne 0 -or ($existing -join "`n") -match 'package:id\.go\.bpn\.sentuh') {
    throw 'Target package already exists or package inventory failed; no replacement attempted.'
}
$manifest = Get-Content -LiteralPath (Join-Path $projectRoot 'analysis\extraction-manifest.json') -Raw | ConvertFrom-Json
$archive = $manifest.archives | Where-Object { $_.source -eq 'Sentuh+Tanahku_6.1.5_APKPure.xapk' }
$apkPaths = @(foreach ($file in $archive.files | Where-Object { $_.path -like '*.apk' }) {
    $path = Join-Path (Join-Path $projectRoot $archive.destination) $file.path
    $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -ne $file.sha256) { throw "Original APK hash mismatch: $($file.path)" }
    $path
})
if ($apkPaths.Count -ne 20) { throw 'Expected complete set of 20 original APKs.' }
# Recheck immediately before install. Never use -r, -d or -g.
$existing = & $adbPath @adbPrefix shell pm list packages id.go.bpn.sentuh
if ($LASTEXITCODE -ne 0 -or ($existing -join "`n") -match 'package:id\.go\.bpn\.sentuh') {
    throw 'Package appeared or package inventory failed before install; stopping.'
}
$result = & $adbPath @adbPrefix install-multiple @apkPaths 2>&1
$exitCode = $LASTEXITCODE
$record = [ordered]@{
    recordedAtUtc = [DateTime]::UtcNow.ToString('o')
    avdName = $expectedAvd
    serial = $emulatorSerial
    api = $api
    abiList = $abi
    nativeBridge = $nativeBridge
    verifiedOriginalApkCount = $apkPaths.Count
    replaceExisting = $false
    grantPermissions = $false
    exitCode = $exitCode
    output = ($result -join "`n")
}
$record | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $reportRoot 'installation.json') -Encoding utf8
$record | ConvertTo-Json
if ($exitCode -ne 0) { throw 'Original APK installation failed; see installation.json.' }
