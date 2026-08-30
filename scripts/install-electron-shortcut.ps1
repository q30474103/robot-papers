[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$appFolder = Join-Path $projectRoot 'release\Robot Papers-win32-x64'
$appExe = Join-Path $appFolder 'Robot Papers.exe'
$iconPath = Join-Path $appFolder 'resources\assets\robot-papers-icon.ico'

if (-not (Test-Path -LiteralPath $appExe)) {
  throw "尚未生成 Robot Papers 桌面版：$appExe"
}

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
  $shortcut.WorkingDirectory = $appFolder
  $shortcut.IconLocation = "$iconPath,0"
  $shortcut.Description = 'Robot Papers desktop app'
  $shortcut.Save()
}

Write-Output "Robot Papers shortcuts created."
