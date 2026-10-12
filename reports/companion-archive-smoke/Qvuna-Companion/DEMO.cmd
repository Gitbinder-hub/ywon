@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto no_node
node -e "process.exit(Number(process.versions.node.split('.')[0]) === 24 ? 0 : 2)"
if errorlevel 1 goto wrong_node
echo Ywon Companion - synthetic file demonstration
node scripts\companion_demo.ts --data-dir "%~dp0local-demo" --confirm-demo
set "Ywon_exit=%errorlevel%"
pause
exit /b %Ywon_exit%
:no_node
echo Node.js 24 was not found. See README.md and https://nodejs.org/
pause
exit /b 2
:wrong_node
echo This pilot requires Node.js 24.x. Installed version:
node --version
pause
exit /b 2
