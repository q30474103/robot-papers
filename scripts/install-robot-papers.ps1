[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$sourceFolder = Join-Path $projectRoot 'release\Robot Papers-win32-x64'
$programsRoot = Join-Path $env:LOCALAPPDATA 'Programs'
$installRoot = Join-Path $programsRoot 'Robot Papers'
$appExe = Join-Path $installRoot 'Robot Papers.exe'
$iconPath = Join-Path $installRoot 'resources\assets\robot-papers-icon.ico'

if (-not (Test-Path -LiteralPath (Join-Path $sourceFolder 'Robot Papers.exe'))) {
  throw 'Packaged Robot Papers was not found. Run electron:package first.'
}

New-Item -ItemType Directory -Path $programsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
Copy-Item -Path (Join-Path $sourceFolder '*') -Destination $installRoot -Recurse -Force

$shell = New-Object -ComObject WScript.Shell
$desktopPath = [Environment]::GetFolderPath('Desktop')
$startMenuFolder = Join-Path ([Environment]::GetFolderPath('Programs')) 'Robot Papers'
New-Item -ItemType Directory -Path $startMenuFolder -Force | Out-Null

foreach ($shortcutPath in @(
  (Join-Path $desktopPath 'Robot Papers.lnk'),
  (Join-Path $startMenuFolder 'Robot Papers.lnk')
)) {
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $appExe
  $shortcut.WorkingDirectory = $installRoot
  $shortcut.IconLocation = "$iconPath,0"
  $shortcut.Description = 'Robot Papers desktop app'
  $shortcut.Save()
}

Write-Output "Installed Robot Papers to $installRoot"
Write-Output 'Desktop and Start menu shortcuts updated.'
