[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$PaperRoot
)

$ErrorActionPreference = 'Stop'
$defaultPaperRoot = 'D:\paper'
$configDirectory = Join-Path $env:APPDATA 'Robot Papers'
$configPath = Join-Path $configDirectory 'config.json'
$selectedPaperRoot = [System.IO.Path]::GetFullPath($PaperRoot.Trim())
$existingConfig = $null

if (Test-Path -LiteralPath $configPath) {
  try {
    $existingConfig = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    $existingConfig = $null
  }
}

# Protect a custom library path created by the legacy installer. The new installer
# can discover paths from its registry entry on later upgrades.
if (
  $existingConfig -and
  $existingConfig.paperRoot -and
  $selectedPaperRoot -eq $defaultPaperRoot -and
  [string]$existingConfig.paperRoot -ne $defaultPaperRoot
) {
  $selectedPaperRoot = [System.IO.Path]::GetFullPath([string]$existingConfig.paperRoot)
}

foreach ($directory in @(
  $selectedPaperRoot,
  (Join-Path $selectedPaperRoot '原文'),
  (Join-Path $selectedPaperRoot 'obsidian'),
  (Join-Path $selectedPaperRoot 'obsidian\日报'),
  (Join-Path $selectedPaperRoot 'obsidian\研读周报')
)) {
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

if (-not $existingConfig) {
  $existingConfig = [PSCustomObject]@{
    paperRoot = $selectedPaperRoot
    ai = [PSCustomObject]@{
      enabled = $true
      provider = 'codex-automation'
      baseUrl = 'https://api.openai.com/v1'
      model = ''
    }
  }
} else {
  if ($existingConfig.PSObject.Properties.Name -contains 'paperRoot') {
    $existingConfig.paperRoot = $selectedPaperRoot
  } else {
    $existingConfig | Add-Member -NotePropertyName paperRoot -NotePropertyValue $selectedPaperRoot
  }
  if (-not $existingConfig.ai) {
    if ($existingConfig.PSObject.Properties.Name -contains 'ai') {
      $existingConfig.ai = [PSCustomObject]@{ enabled = $true; provider = 'codex-automation'; baseUrl = 'https://api.openai.com/v1'; model = '' }
    } else {
      $existingConfig | Add-Member -NotePropertyName ai -NotePropertyValue ([PSCustomObject]@{ enabled = $true; provider = 'codex-automation'; baseUrl = 'https://api.openai.com/v1'; model = '' })
    }
  }
}

New-Item -ItemType Directory -Path $configDirectory -Force | Out-Null
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
$json = $existingConfig | ConvertTo-Json -Depth 12
[System.IO.File]::WriteAllText($configPath, $json, $utf8WithoutBom)

$registryKey = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Software\Robot Papers')
try {
  $registryKey.SetValue('PaperRoot', $selectedPaperRoot, [Microsoft.Win32.RegistryValueKind]::String)
} finally {
  $registryKey.Dispose()
}
