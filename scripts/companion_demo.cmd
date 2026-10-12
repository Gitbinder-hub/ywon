@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 is required. No installation is performed by this pilot.
  pause
  exit /b 2
)
if "%LOCALAPPDATA%"=="" (
  echo LOCALAPPDATA is not available. Use the documented node command with an explicit folder.
  pause
  exit /b 2
)
node "%~dp0companion_demo.ts" --data-dir "%LOCALAPPDATA%\Qevunara\CompanionPilot" --confirm-demo
set RESULT=%ERRORLEVEL%
echo This is an offline source pilot, not a production installer or connected AI assistant.
pause
exit /b %RESULT%
