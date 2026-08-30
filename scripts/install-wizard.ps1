[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$payloadRoot = Join-Path $PSScriptRoot 'payload-unpacked'
$payloadArchive = Join-Path $PSScriptRoot 'payload.tar'
if (-not (Test-Path -LiteralPath (Join-Path $payloadRoot 'Robot Papers.exe'))) {
  if (Test-Path -LiteralPath $payloadArchive) {
    New-Item -ItemType Directory -Path $payloadRoot -Force | Out-Null
    & tar.exe -xf $payloadArchive -C $payloadRoot
    if ($LASTEXITCODE -ne 0) { throw 'Unable to unpack the application payload.' }
  } else {
    $payloadRoot = $PSScriptRoot
  }
}

$configDir = Join-Path $env:APPDATA 'Robot Papers'
$configPath = Join-Path $configDir 'config.json'
$defaultPaperRoot = 'D:\paper'
$defaultAiProvider = 'codex-automation'
$defaultAiBaseUrl = 'https://api.openai.com/v1'
$defaultAiModel = ''
$existingAiKey = ''
if (Test-Path -LiteralPath $configPath) {
  try {
    $existingConfig = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    if ($existingConfig.paperRoot) { $defaultPaperRoot = [string]$existingConfig.paperRoot }
    if ($existingConfig.ai) {
      if ($existingConfig.ai.provider) { $defaultAiProvider = [string]$existingConfig.ai.provider }
      if ($existingConfig.ai.baseUrl) { $defaultAiBaseUrl = [string]$existingConfig.ai.baseUrl }
      if ($existingConfig.ai.model) { $defaultAiModel = [string]$existingConfig.ai.model }
      if ($existingConfig.ai.apiKey) { $existingAiKey = [string]$existingConfig.ai.apiKey }
    }
  } catch {}
}
$defaultInstallRoot = Join-Path $env:LOCALAPPDATA 'Programs\Robot Papers'

$form = New-Object System.Windows.Forms.Form
$form.Text = 'Robot Papers Setup'
$form.StartPosition = 'CenterScreen'
$form.Size = New-Object System.Drawing.Size(720, 735)
$form.MinimumSize = New-Object System.Drawing.Size(720, 735)
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.BackColor = [System.Drawing.Color]::White

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Robot Papers'
$title.Location = New-Object System.Drawing.Point(32, 24)
$title.Size = New-Object System.Drawing.Size(620, 34)
$title.Font = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
$title.ForeColor = [System.Drawing.Color]::FromArgb(20, 62, 125)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = 'Install the desktop app and configure your local paper library.'
$subtitle.Location = New-Object System.Drawing.Point(34, 62)
$subtitle.Size = New-Object System.Drawing.Size(640, 24)
$subtitle.ForeColor = [System.Drawing.Color]::DimGray

$libraryLabel = New-Object System.Windows.Forms.Label
$libraryLabel.Text = 'Paper library root (contains obsidian and original folders):'
$libraryLabel.Location = New-Object System.Drawing.Point(34, 112)
$libraryLabel.Size = New-Object System.Drawing.Size(600, 22)

$libraryBox = New-Object System.Windows.Forms.TextBox
$libraryBox.Text = $defaultPaperRoot
$libraryBox.Location = New-Object System.Drawing.Point(34, 138)
$libraryBox.Size = New-Object System.Drawing.Size(540, 28)

$browseLibrary = New-Object System.Windows.Forms.Button
$browseLibrary.Text = 'Browse...'
$browseLibrary.Location = New-Object System.Drawing.Point(586, 136)
$browseLibrary.Size = New-Object System.Drawing.Size(92, 30)

$installLabel = New-Object System.Windows.Forms.Label
$installLabel.Text = 'Install location:'
$installLabel.Location = New-Object System.Drawing.Point(34, 188)
$installLabel.Size = New-Object System.Drawing.Size(600, 22)

$installBox = New-Object System.Windows.Forms.TextBox
$installBox.Text = $defaultInstallRoot
$installBox.Location = New-Object System.Drawing.Point(34, 214)
$installBox.Size = New-Object System.Drawing.Size(540, 28)

$browseInstall = New-Object System.Windows.Forms.Button
$browseInstall.Text = 'Browse...'
$browseInstall.Location = New-Object System.Drawing.Point(586, 212)
$browseInstall.Size = New-Object System.Drawing.Size(92, 30)

$hint = New-Object System.Windows.Forms.Label
$hint.Text = 'The app reads papers locally and never uploads this folder.'
$hint.Location = New-Object System.Drawing.Point(34, 250)
$hint.Size = New-Object System.Drawing.Size(640, 22)
$hint.ForeColor = [System.Drawing.Color]::DimGray

$desktopCheck = New-Object System.Windows.Forms.CheckBox
$desktopCheck.Text = 'Create a desktop shortcut'
$desktopCheck.Checked = $true
$aiTitle = New-Object System.Windows.Forms.Label
$aiTitle.Text = 'AI mode (Codex scheduled tasks are recommended)'
$aiTitle.Location = New-Object System.Drawing.Point(34, 286)
$aiTitle.Size = New-Object System.Drawing.Size(640, 22)
$aiTitle.Font = New-Object System.Drawing.Font('Segoe UI', 9, [System.Drawing.FontStyle]::Bold)

$aiCheck = New-Object System.Windows.Forms.CheckBox
$aiCheck.Text = 'Enable AI report generation'
$aiCheck.Checked = $true
$aiCheck.Location = New-Object System.Drawing.Point(34, 314)
$aiCheck.Size = New-Object System.Drawing.Size(280, 26)

$aiProviderLabel = New-Object System.Windows.Forms.Label
$aiProviderLabel.Text = 'Type:'
$aiProviderLabel.Location = New-Object System.Drawing.Point(34, 350)
$aiProviderLabel.Size = New-Object System.Drawing.Size(45, 22)
$aiProviderBox = New-Object System.Windows.Forms.TextBox
$aiProviderBox.Text = $defaultAiProvider
$aiProviderBox.Location = New-Object System.Drawing.Point(82, 347)
$aiProviderBox.Size = New-Object System.Drawing.Size(180, 28)

$aiModelLabel = New-Object System.Windows.Forms.Label
$aiModelLabel.Text = 'Model:'
$aiModelLabel.Location = New-Object System.Drawing.Point(286, 350)
$aiModelLabel.Size = New-Object System.Drawing.Size(52, 22)
$aiModelBox = New-Object System.Windows.Forms.TextBox
$aiModelBox.Text = $defaultAiModel
$aiModelBox.Location = New-Object System.Drawing.Point(342, 347)
$aiModelBox.Size = New-Object System.Drawing.Size(336, 28)

$aiUrlLabel = New-Object System.Windows.Forms.Label
$aiUrlLabel.Text = 'API URL:'
$aiUrlLabel.Location = New-Object System.Drawing.Point(34, 388)
$aiUrlLabel.Size = New-Object System.Drawing.Size(55, 22)
$aiUrlBox = New-Object System.Windows.Forms.TextBox
$aiUrlBox.Text = $defaultAiBaseUrl
$aiUrlBox.Location = New-Object System.Drawing.Point(94, 385)
$aiUrlBox.Size = New-Object System.Drawing.Size(584, 28)

$aiKeyLabel = New-Object System.Windows.Forms.Label
$aiKeyLabel.Text = 'API Key:'
$aiKeyLabel.Location = New-Object System.Drawing.Point(34, 426)
$aiKeyLabel.Size = New-Object System.Drawing.Size(55, 22)
$aiKeyBox = New-Object System.Windows.Forms.TextBox
$aiKeyBox.Text = $existingAiKey
$aiKeyBox.UseSystemPasswordChar = $true
$aiKeyBox.Location = New-Object System.Drawing.Point(94, 423)
$aiKeyBox.Size = New-Object System.Drawing.Size(584, 28)

$aiHint = New-Object System.Windows.Forms.Label
$aiHint.Text = 'codex-automation uses your Codex task quota and does not require an API key.'
$aiHint.Location = New-Object System.Drawing.Point(34, 458)
$aiHint.Size = New-Object System.Drawing.Size(640, 22)
$aiHint.ForeColor = [System.Drawing.Color]::DimGray

$desktopCheck.Location = New-Object System.Drawing.Point(34, 500)
$desktopCheck.Size = New-Object System.Drawing.Size(260, 26)

$startCheck = New-Object System.Windows.Forms.CheckBox
$startCheck.Text = 'Create a Start Menu shortcut'
$startCheck.Checked = $true
$startCheck.Location = New-Object System.Drawing.Point(320, 500)
$startCheck.Size = New-Object System.Drawing.Size(300, 26)

$launchCheck = New-Object System.Windows.Forms.CheckBox
$launchCheck.Text = 'Launch Robot Papers after setup'
$launchCheck.Checked = $true
$launchCheck.Location = New-Object System.Drawing.Point(34, 534)
$launchCheck.Size = New-Object System.Drawing.Size(300, 26)

$startupCheck = New-Object System.Windows.Forms.CheckBox
$startupCheck.Text = 'Start Robot Papers when Windows signs in (recommended for scheduled reports)'
$startupCheck.Checked = $true
$startupCheck.Location = New-Object System.Drawing.Point(34, 568)
$startupCheck.Size = New-Object System.Drawing.Size(610, 26)

$status = New-Object System.Windows.Forms.Label
$status.Text = 'Ready to install.'
$status.Location = New-Object System.Drawing.Point(34, 642)
$status.Size = New-Object System.Drawing.Size(430, 28)
$status.ForeColor = [System.Drawing.Color]::DimGray

$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Text = 'Cancel'
$cancelButton.Location = New-Object System.Drawing.Point(490, 638)
$cancelButton.Size = New-Object System.Drawing.Size(88, 34)
$cancelButton.Add_Click({ $form.Close() })

$installButton = New-Object System.Windows.Forms.Button
$installButton.Text = 'Install'
$installButton.Location = New-Object System.Drawing.Point(590, 638)
$installButton.Size = New-Object System.Drawing.Size(88, 34)
$installButton.BackColor = [System.Drawing.Color]::FromArgb(25, 103, 210)
$installButton.ForeColor = [System.Drawing.Color]::White
$installButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat

foreach ($control in @($title, $subtitle, $libraryLabel, $libraryBox, $browseLibrary, $installLabel, $installBox, $browseInstall, $hint, $aiTitle, $aiCheck, $aiProviderLabel, $aiProviderBox, $aiModelLabel, $aiModelBox, $aiUrlLabel, $aiUrlBox, $aiKeyLabel, $aiKeyBox, $aiHint, $desktopCheck, $startCheck, $launchCheck, $startupCheck, $status, $cancelButton, $installButton)) {
  $form.Controls.Add($control)
}

$browseLibrary.Add_Click({
  $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $dialog.Description = 'Select your paper library root'
  $dialog.ShowNewFolderButton = $true
  if (Test-Path -LiteralPath $libraryBox.Text) { $dialog.SelectedPath = $libraryBox.Text }
  if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $libraryBox.Text = $dialog.SelectedPath }
  $dialog.Dispose()
})

$browseInstall.Add_Click({
  $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $dialog.Description = 'Select the application install location'
  $dialog.ShowNewFolderButton = $true
  if (Test-Path -LiteralPath $installBox.Text) { $dialog.SelectedPath = $installBox.Text }
  if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $installBox.Text = $dialog.SelectedPath }
  $dialog.Dispose()
})

function New-RobotPapersShortcut([string]$shortcutPath, [string]$appExe, [string]$iconPath, [string]$installRoot) {
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $appExe
  $shortcut.WorkingDirectory = $installRoot
  $shortcut.IconLocation = "$iconPath,0"
  $shortcut.Description = 'Robot Papers desktop app'
  $shortcut.Save()
}

$installButton.Add_Click({
  try {
    $paperRoot = $libraryBox.Text.Trim()
    $installRoot = $installBox.Text.Trim()
    if ([string]::IsNullOrWhiteSpace($paperRoot)) { throw 'Please choose a paper library root.' }
    if ([string]::IsNullOrWhiteSpace($installRoot)) { throw 'Please choose an install location.' }
    $paperRoot = [System.IO.Path]::GetFullPath($paperRoot)
    $installRoot = [System.IO.Path]::GetFullPath($installRoot)

    $running = @(Get-Process -Name 'Robot Papers' -ErrorAction SilentlyContinue)
    if ($running.Count -gt 0) {
      [System.Windows.Forms.MessageBox]::Show('Please close Robot Papers before installing an update.', 'Robot Papers Setup', 'OK', 'Warning') | Out-Null
      return
    }

    if (-not (Test-Path -LiteralPath $paperRoot)) {
      $answer = [System.Windows.Forms.MessageBox]::Show("The paper library folder does not exist yet:`n$paperRoot`n`nCreate it now?", 'Robot Papers Setup', 'YesNo', 'Question')
      if ($answer -ne [System.Windows.Forms.DialogResult]::Yes) { return }
      New-Item -ItemType Directory -Path $paperRoot -Force | Out-Null
    }

    $installButton.Enabled = $false
    $cancelButton.Enabled = $false
    $form.Cursor = [System.Windows.Forms.Cursors]::WaitCursor
    $status.Text = 'Copying application files...'
    [System.Windows.Forms.Application]::DoEvents()
    New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
    Copy-Item -Path (Join-Path $payloadRoot '*') -Destination $installRoot -Recurse -Force

    $status.Text = 'Saving library and AI configuration...'
    [System.Windows.Forms.Application]::DoEvents()
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    $aiKey = $aiKeyBox.Text.Trim()
    if ([string]::IsNullOrWhiteSpace($aiKey)) { $aiKey = $existingAiKey }
    $config = @{
      paperRoot = $paperRoot
      configuredAt = (Get-Date).ToUniversalTime().ToString('o')
      ai = @{
        enabled = $aiCheck.Checked
        provider = $aiProviderBox.Text.Trim()
        baseUrl = $aiUrlBox.Text.Trim().TrimEnd('/')
        model = $aiModelBox.Text.Trim()
        apiKey = $aiKey
      }
    } | ConvertTo-Json -Depth 4
    $utf8NoBom = New-Object -TypeName System.Text.UTF8Encoding -ArgumentList $false
    [System.IO.File]::WriteAllText($configPath, $config, $utf8NoBom)

    $appExe = Join-Path $installRoot 'Robot Papers.exe'
    $iconPath = Join-Path $installRoot 'resources\assets\robot-papers-icon.ico'
    $desktopPath = [Environment]::GetFolderPath('Desktop')
    $startMenuFolder = Join-Path ([Environment]::GetFolderPath('Programs')) 'Robot Papers'
    if ($desktopCheck.Checked) {
      New-RobotPapersShortcut (Join-Path $desktopPath 'Robot Papers.lnk') $appExe $iconPath $installRoot
    }
    if ($startCheck.Checked) {
      New-Item -ItemType Directory -Path $startMenuFolder -Force | Out-Null
      New-RobotPapersShortcut (Join-Path $startMenuFolder 'Robot Papers.lnk') $appExe $iconPath $installRoot
    }
    $startupShortcut = Join-Path ([Environment]::GetFolderPath('Startup')) 'Robot Papers.lnk'
    if ($startupCheck.Checked) {
      New-RobotPapersShortcut $startupShortcut $appExe $iconPath $installRoot
    } elseif (Test-Path -LiteralPath $startupShortcut) {
      Remove-Item -LiteralPath $startupShortcut -Force
    }

    $status.Text = 'Setup complete.'
    $form.Cursor = [System.Windows.Forms.Cursors]::Default
    [System.Windows.Forms.MessageBox]::Show("Robot Papers is ready.`n`nLibrary: $paperRoot`nAI: $($aiProviderBox.Text) / $($aiModelBox.Text)", 'Robot Papers Setup', 'OK', 'Information') | Out-Null
    $shouldLaunch = $launchCheck.Checked
    $form.Close()
    if ($shouldLaunch) { Start-Process -FilePath $appExe }
  } catch {
    $form.Cursor = [System.Windows.Forms.Cursors]::Default
    $installButton.Enabled = $true
    $cancelButton.Enabled = $true
    [System.Windows.Forms.MessageBox]::Show("Setup failed:`n$($_.Exception.Message)", 'Robot Papers Setup', 'OK', 'Error') | Out-Null
  }
})

$form.AcceptButton = $installButton
$form.CancelButton = $cancelButton
[void]$form.ShowDialog()
