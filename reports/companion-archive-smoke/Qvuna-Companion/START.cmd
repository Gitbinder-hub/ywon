@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto no_node
node -e "process.exit(Number(process.versions.node.split('.')[0]) === 24 ? 0 : 2)"
if errorlevel 1 goto wrong_node
echo Ywon Companion - local audio pilot
echo Copy the http://127.0.0.1:PORT URL below into Chrome or Edge.
echo Keep this window open. Close it to stop the server.
echo Speech recognition and conversational AI are NOT enabled in this mode.
node scripts\companion_audio.ts --local-audio-pilot
set "Ywon_exit=%errorlevel%"
if not "%Ywon_exit%"=="0" pause
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
