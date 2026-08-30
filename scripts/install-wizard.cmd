@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0install-wizard.ps1"
exit /b %errorlevel%
