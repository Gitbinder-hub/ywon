@echo off
setlocal
cd /d "%~dp0"
rem Portable runtime priority: E:/Ywoom-ASR > ./node-portable > system Node
if exist "E:\Ywoom-ASR\node-portable\node.exe" (
  set "Ywon_NODE=E:\Ywoom-ASR\node-portable\node.exe"
  goto have_node
)
if exist "%~dp0node-portable\node.exe" (
  set "Ywon_NODE=%~dp0node-portable\node.exe"
  goto have_node
)
where node >nul 2>nul
if errorlevel 1 goto no_node
set "Ywon_NODE=node"
:have_node
"%Ywon_NODE%" -e "process.exit(Number(process.versions.node.split('.')[0]) === 24 ? 0 : 2)"
if errorlevel 1 goto wrong_node
echo Ywon Companion - local audio pilot
if "%Ywon_NODE%"=="E:\Ywoom-ASR\node-portable\node.exe" echo Using portable Node on E:/Ywoom-ASR
if "%Ywon_NODE%"=="%~dp0node-portable\node.exe" echo Using bundled portable Node
echo Copy the http://127.0.0.1:PORT URL below - YwonTray will open it in WebView2.
echo Keep this window open. Close it to stop the server.
"%Ywon_NODE%" scripts\companion_audio.ts --local-audio-pilot
set "Ywon_exit=%errorlevel%"
if not "%Ywon_exit%"=="0" pause
exit /b %Ywon_exit%
:no_node
echo Node.js 24 was not found. Install portable Node to E:/Ywoom-ASR/node-portable or system Node 24. See README.md
pause
exit /b 2
:wrong_node
echo This pilot requires Node.js 24.x. Installed version:
"%Ywon_NODE%" --version
pause
exit /b 2
