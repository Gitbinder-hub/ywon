@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto no_node
node -e "process.exit(Number(process.versions.node.split('.')[0]) === 24 ? 0 : 2)"
if errorlevel 1 goto wrong_node
if not exist "local-asr-config\asr-config.json" goto no_config
echo Ywon Companion - optional LOCAL speech recognition
echo Copy the http://127.0.0.1:PORT URL below into Chrome or Edge.
echo Browser consent is still required. Keep this window open.
node scripts\companion_audio.ts --local-audio-pilot --asr-config "%~dp0local-asr-config\asr-config.json" --allow-local-asr
set "Ywon_exit=%errorlevel%"
if not "%Ywon_exit%"=="0" pause
exit /b %Ywon_exit%
:no_config
echo ASR is not configured. Read bootstrap\COMPANION_ASR_PILOT.md.
echo No files were downloaded or installed. START.cmd works without ASR.
pause
exit /b 2
:no_node
echo Node.js 24 was not found. See README.md and https://nodejs.org/
pause
exit /b 2
:wrong_node
echo This pilot requires Node.js 24.x. Installed version:
node --version
pause
exit /b 2
