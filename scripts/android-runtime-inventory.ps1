#requires -Version 7.0
<#!
.SYNOPSIS
  Bounded, read-only discovery for original Sentuh Tanahku APK testing.
.DESCRIPTION
  Does not install, launch, clear, uninstall, log in, collect logs/screenshots,
  connect/pair wireless devices, change device settings, or accept trust prompts.
  Optional device metadata queries use adb -d (physical USB only).
#>
[CmdletBinding()]
param(
    [switch]$IncludeSingleUsbDeviceMetadata,
    [ValidateRange(1024, 65535)][int]$AdbPort = 5038,
    [ValidateRange(2, 60)][int]$CommandTimeoutSeconds = 15
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputRoot = Join-Path $projectRoot 'analysis\runtime'
$logRoot = Join-Path $outputRoot 'logs'
$adbPath = Join-Path $projectRoot 'environment\android\platform-tools\adb.exe'
New-Item -ItemType Directory -Path $outputRoot, $logRoot -Force | Out-Null

function Invoke-BoundedAdb {
    param([string[]]$Arguments)
    $info = [System.Diagnostics.ProcessStartInfo]::new()
    $info.FileName = $adbPath
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    # Do not discover and automatically connect to wireless-debugging services.
    $info.Environment['ADB_MDNS_AUTO_CONNECT'] = '0'
    foreach ($arg in $Arguments) { $info.ArgumentList.Add($arg) }
    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $info
    try {
        [void]$process.Start()
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $stderr = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit($CommandTimeoutSeconds * 1000)) {
            $process.Kill($true)
            throw "ADB command timed out after $CommandTimeoutSeconds seconds"
        }
        [ordered]@{
            exitCode = $process.ExitCode
            stdout = $stdout.GetAwaiter().GetResult().Trim()
            stderr = $stderr.GetAwaiter().GetResult().Trim()
        }
    } finally { $process.Dispose() }
}

$sdkCandidates = @(
    "$env:LOCALAPPDATA\Android\Sdk", "$env:LOCALAPPDATA\Android",
    "$env:ProgramFiles\Android", "${env:ProgramFiles(x86)}\Android",
    "$env:ProgramFiles\BlueStacks_nxt", "$env:ProgramFiles\BlueStacks",
    'C:\ProgramData\BlueStacks_nxt', 'C:\LDPlayer', 'C:\Program Files\Nox',
    'C:\Program Files\Genymobile'
)
$pathTools = @('adb', 'emulator', 'sdkmanager', 'java', 'VBoxManage',
    'qemu-system-aarch64', 'qemu-system-x86_64') | ForEach-Object {
    $toolName = $_
    $command = Get-Command $toolName -ErrorAction SilentlyContinue
    [ordered]@{ name = $toolName; found = [bool]$command; path = $command.Source }
}
$report = [ordered]@{
    schemaVersion = 1
    recordedAtUtc = [DateTime]::UtcNow.ToString('o')
    discoveryScope = 'PATH, standard install directories, registered Android products, processes, PnP, local ADB inventory; not a complete disk search'
    package = 'id.go.bpn.sentuh'
    pathTools = @($pathTools)
    existingSdkCandidates = @($sdkCandidates | Where-Object { Test-Path -LiteralPath $_ })
    runningAndroidProcesses = @(Get-Process | Where-Object {
        $_.ProcessName -match 'adb|emulator|bluestack|HD-Player|qemu|nox|vbox|studio|ldplayer|memu'
    } | Select-Object ProcessName)
    installedAndroidProducts = @(Get-ItemProperty `
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*', `
        'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*', `
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' `
        -ErrorAction SilentlyContinue | Where-Object {
            $_.DisplayName -match 'Android|BlueStacks|Nox|LDPlayer|Genymotion|MEmu'
        } | Select-Object DisplayName, InstallLocation)
    windowsSubsystemForAndroid = @(Get-AppxPackage -Name '*WindowsSubsystemForAndroid*' `
        -ErrorAction SilentlyContinue | Select-Object Name, InstallLocation)
    processors = @(Get-CimInstance Win32_Processor | Select-Object Name, Architecture,
        VirtualizationFirmwareEnabled, VMMonitorModeExtensions)
    hypervisorPresent = [bool](Get-CimInstance Win32_ComputerSystem).HypervisorPresent
    androidPnpDevices = @(Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue |
        Where-Object { $_.FriendlyName -match 'Android|ADB|OPPO|Find X9|MTP' -or $_.Class -eq 'WPD' } |
        Select-Object Class, FriendlyName, Status)
    adb = [ordered]@{ localBinaryPresent = Test-Path -LiteralPath $adbPath }
    deviceMetadataRequested = [bool]$IncludeSingleUsbDeviceMetadata
    runtimeTestCount = 0
}

if ($report.adb.localBinaryPresent) {
    if (Get-NetTCPConnection -LocalPort $AdbPort -State Listen -ErrorAction SilentlyContinue) {
        throw "Port $AdbPort is already in use. Select another AdbPort; this script will not stop an existing server."
    }
    $report.adb.version = Invoke-BoundedAdb -Arguments @('version')
    $startedDedicatedServer = $false
    try {
        $startedDedicatedServer = $true
        $result = Invoke-BoundedAdb -Arguments @('-P', "$AdbPort", 'devices', '-l')
        $deviceLines = @($result.stdout -split "`r?`n" | Where-Object {
            $_.Trim() -and $_ -notmatch '^List of devices attached'
        })
        $index = 0
        $sanitizedLines = foreach ($line in $deviceLines) {
            $index++
            $line -replace '^\S+', "device-$index"
        }
        $report.adb.inventoryExitCode = $result.exitCode
        $report.adb.deviceCount = $deviceLines.Count
        $report.adb.deviceLinesRedacted = @($sanitizedLines)
        $report.adb.inventoryStderr = $result.stderr
        $report.adb.serverPort = $AdbPort
        $report.adb.wirelessAutoConnect = $false
        $report.adb.dedicatedServerStopped = $false
        @('List of devices attached') + $sanitizedLines | Set-Content `
            -LiteralPath (Join-Path $logRoot 'adb-devices-redacted.txt') -Encoding utf8
        if ($IncludeSingleUsbDeviceMetadata) {
            $state = Invoke-BoundedAdb -Arguments @('-P', "$AdbPort", '-d', 'get-state')
            $report.adb.usbState = $state
            if ($state.exitCode -eq 0 -and $state.stdout -eq 'device') {
                $properties = [ordered]@{}
                foreach ($property in @('ro.product.manufacturer', 'ro.product.model',
                    'ro.build.version.sdk', 'ro.build.version.release', 'ro.product.cpu.abilist')) {
                    $properties[$property] = Invoke-BoundedAdb -Arguments @('-P', "$AdbPort", '-d',
                        'shell', 'getprop', $property)
                }
                $report.adb.usbDeviceProperties = $properties
                $report.adb.targetPackage = Invoke-BoundedAdb -Arguments @('-P', "$AdbPort", '-d',
                    'shell', 'pm', 'list', 'packages', '--show-versioncode', 'id.go.bpn.sentuh')
            }
        }
    } finally {
        if ($startedDedicatedServer) {
            $stopResult = Invoke-BoundedAdb -Arguments @('-P', "$AdbPort", 'kill-server')
            $report.adb.dedicatedServerStopped = ($stopResult.exitCode -eq 0)
        }
    }
}

$manifestPath = Join-Path $projectRoot 'analysis\extraction-manifest.json'
if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $archive = $manifest.archives | Where-Object { $_.source -eq 'Sentuh+Tanahku_6.1.5_APKPure.xapk' }
    $report.originalSplitIntegrity = @(foreach ($file in $archive.files | Where-Object { $_.path -like '*.apk' }) {
        $fullPath = Join-Path (Join-Path $projectRoot $archive.destination) $file.path
        $actual = (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash.ToLowerInvariant()
        [ordered]@{ file = $file.path; sha256 = $actual; matchesExtractionManifest = $actual -eq $file.sha256 }
    })
}

$report | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $outputRoot 'inventory.json') -Encoding utf8
$report | ConvertTo-Json -Depth 10

