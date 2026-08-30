@echo off
if exist "%LOCALAPPDATA%\Programs\Robot Papers\Robot Papers.exe" (
  start "" "%LOCALAPPDATA%\Programs\Robot Papers\Robot Papers.exe"
  exit /b 0
)
if exist "%~dp0release\Robot Papers-win32-x64\Robot Papers.exe" (
  start "" "%~dp0release\Robot Papers-win32-x64\Robot Papers.exe"
  exit /b 0
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-robot-papers.ps1"
if errorlevel 1 pause
