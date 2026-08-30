[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodeExe = if ($nodeCommand) { $nodeCommand.Source } else { $null }
$runtimeRoot = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$bundledNodeExe = Join-Path $runtimeRoot 'node\bin\node.exe'
$fallbackBin = Join-Path $runtimeRoot 'bin\fallback'
if (-not $nodeExe -and (Test-Path -LiteralPath $bundledNodeExe)) { $nodeExe = $bundledNodeExe }
$vinextCli = Join-Path $projectRoot 'node_modules\vinext\dist\cli.js'
$syncScript = Join-Path $projectRoot 'scripts\sync-library.mjs'
$logDir = Join-Path $projectRoot 'logs'
$stdoutLog = Join-Path $logDir 'robot-papers-server.log'
$stderrLog = Join-Path $logDir 'robot-papers-error.log'
$siteUrl = 'http://localhost:3000/'

function Test-RobotPapers {
  try {
    $response = Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200 -and $response.Content -match 'Robot Papers'
  }
  catch {
    return $false
  }
}

try {
  if (-not (Test-RobotPapers)) {
    if (-not $nodeExe) {
      throw '没有找到 Node.js。请安装 Node.js 22 或更高版本，然后重新运行。'
    }
    foreach ($requiredFile in @($nodeExe, $vinextCli, $syncScript)) {
      if (-not (Test-Path -LiteralPath $requiredFile)) {
        throw "缺少启动文件：$requiredFile"
      }
    }

    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    $env:Path = "$(Split-Path -Parent $nodeExe);$env:Path"
    if (Test-Path -LiteralPath $fallbackBin) { $env:Path = "$fallbackBin;$env:Path" }

    & $nodeExe $syncScript *>> $stdoutLog
    if ($LASTEXITCODE -ne 0) {
      throw "论文库同步失败。请查看日志：$stdoutLog"
    }

    $server = Start-Process `
      -FilePath $nodeExe `
      -ArgumentList @($vinextCli, 'dev', '--port', '3000') `
      -WorkingDirectory $projectRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $stdoutLog `
      -RedirectStandardError $stderrLog `
      -PassThru

    $ready = $false
    for ($attempt = 0; $attempt -lt 90; $attempt += 1) {
      Start-Sleep -Milliseconds 500
      if (Test-RobotPapers) {
        $ready = $true
        break
      }
      if ($server.HasExited) {
        break
      }
    }

    if (-not $ready) {
      $details = if (Test-Path -LiteralPath $stderrLog) {
        (Get-Content -LiteralPath $stderrLog -Tail 12 -ErrorAction SilentlyContinue) -join [Environment]::NewLine
      }
      else {
        '没有生成错误日志。'
      }
      throw "服务器未能启动。$([Environment]::NewLine)$details"
    }
  }

  Start-Process -FilePath $siteUrl
}
catch {
  Add-Type -AssemblyName PresentationFramework
  $message = "Robot Papers 启动失败：$([Environment]::NewLine)$($_.Exception.Message)$([Environment]::NewLine)$([Environment]::NewLine)日志目录：$logDir"
  [System.Windows.MessageBox]::Show($message, 'Robot Papers', 'OK', 'Error') | Out-Null
  exit 1
}
