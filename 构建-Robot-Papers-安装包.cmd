@echo off
setlocal
where pnpm >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd" (
    set "PATH=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback;%PATH%"
  )
)
cd /d "%~dp0"
call pnpm electron:installer
if errorlevel 1 pause
