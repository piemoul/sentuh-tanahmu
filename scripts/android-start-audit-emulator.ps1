#requires -Version 7.0
<#
Starts the dedicated project-local Android audit emulator. Existing AVD data is
preserved. Does not install APKs, grant app permissions, change host settings,
inject GPS, patch the app, hide debugging/emulator state, or log in.
#>
[CmdletBinding()]
param([switch]$Visible, [ValidateSet(30,36)][int]$ApiLevel = 30)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$sdkRoot = Join-Path $projectRoot 'environment\android'
$avdRoot = Join-Path $sdkRoot 'avd'
$avdName = "sentuh_audit_api$ApiLevel"
$emulatorPort = if ($ApiLevel -eq 30) { 5580 } else { 5582 }
$avdPath = Join-Path $avdRoot "$avdName.avd"
$systemImage = Join-Path $sdkRoot "system-images\android-$ApiLevel\google_apis\x86_64"
$reportRoot = Join-Path $projectRoot 'analysis\runtime\emulator'
if ($ApiLevel -eq 36) { $reportRoot = Join-Path $reportRoot 'api36' }
$runRoot = Join-Path $reportRoot ('runs\' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'))
$emulatorPath = Join-Path $sdkRoot 'emulator\emulator.exe'
$adbPath = Join-Path $sdkRoot 'platform-tools\adb.exe'
if (-not (Test-Path -LiteralPath (Join-Path $systemImage 'system.img'))) {
    throw "Official API$ApiLevel Google APIs x86_64 system image is not installed."
}
if (Get-NetTCPConnection -LocalPort $emulatorPort,($emulatorPort + 1) -State Listen -ErrorAction SilentlyContinue) {
    throw 'Dedicated emulator ports are already in use. Do not start another instance.'
}
New-Item -ItemType Directory -Path $avdPath, $runRoot -Force | Out-Null
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:ANDROID_AVD_HOME = $avdRoot
$env:ANDROID_EMULATOR_HOME = Join-Path $sdkRoot 'emulator-home'
$env:ANDROID_USER_HOME = Join-Path $sdkRoot 'user-home'
$env:ANDROID_ADB_SERVER_PORT = '5038'
$env:ADB_MDNS_AUTO_CONNECT = '0'
New-Item -ItemType Directory -Path $env:ANDROID_EMULATOR_HOME, $env:ANDROID_USER_HOME -Force | Out-Null
$configPath = Join-Path $avdPath 'config.ini'
if (-not (Test-Path -LiteralPath $configPath)) {
    @"
AvdId=$avdName
PlayStore.enabled=false
abi.type=x86_64
avd.ini.displayname=Sentuh Tanahku APK audit API $ApiLevel
avd.ini.encoding=UTF-8
disk.dataPartition.size=4G
fastboot.forceColdBoot=yes
hw.accelerometer=yes
hw.audioInput=no
hw.battery=yes
hw.camera.back=none
hw.camera.front=none
hw.cpu.arch=x86_64
hw.cpu.ncore=4
hw.gps=yes
hw.gpu.enabled=yes
hw.gpu.mode=swiftshader
hw.keyboard=yes
hw.lcd.density=480
hw.lcd.height=1920
hw.lcd.width=1080
hw.mainKeys=no
hw.ramSize=3072
hw.sdCard=no
image.sysdir.1=$systemImage\
runtime.network.latency=none
runtime.network.speed=full
showDeviceFrame=no
skin.dynamic=yes
skin.name=1080x1920
tag.display=Google APIs
tag.id=google_apis
target=android-$ApiLevel
vm.heapSize=256
"@ | Set-Content -LiteralPath $configPath -Encoding utf8NoBOM
    @"
avd.ini.encoding=UTF-8
path=$avdPath
target=android-$ApiLevel
"@ | Set-Content -LiteralPath (Join-Path $avdRoot "$avdName.ini") -Encoding utf8NoBOM
}
& $adbPath -P 5038 start-server
if ($LASTEXITCODE -ne 0) { throw 'Could not start project audit ADB server.' }
$arguments = @('-avd', $avdName, '-port', "$emulatorPort", '-no-audio', '-no-boot-anim',
    '-no-snapshot', '-gpu', 'swiftshader', '-accel', 'on', '-memory', '3072', '-cores', '4')
if (-not $Visible) { $arguments += '-no-window' }
$processOptions = @{
    FilePath = $emulatorPath
    ArgumentList = $arguments
    WorkingDirectory = $sdkRoot
    PassThru = $true
    RedirectStandardOutput = Join-Path $runRoot 'emulator-stdout.log'
    RedirectStandardError = Join-Path $runRoot 'emulator-stderr.log'
}
if (-not $Visible) { $processOptions.WindowStyle = 'Hidden' }
$process = Start-Process @processOptions
$state = [ordered]@{
    startedAtUtc = [DateTime]::UtcNow.ToString('o')
    pid = $process.Id
    emulatorSerial = "emulator-$emulatorPort"
    adbPort = 5038
    avdName = $avdName
    avdPath = $avdPath
    systemImage = $systemImage
    evidenceDirectory = $runRoot
    arguments = $arguments
    visible = [bool]$Visible
    apkInstalledByThisScript = $false
}
$state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $runRoot 'launch.json') -Encoding utf8
$state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $reportRoot 'latest-launch.json') -Encoding utf8
$state | ConvertTo-Json -Depth 4
