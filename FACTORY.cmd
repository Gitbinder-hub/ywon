@echo off
setlocal
cd /d "%~dp0"
rem Factory server: main product (landing/journey/studio/billing/offline)
if not "%PORT%"=="" goto port_set
set "PORT=3000"
:port_set
if exist "E:\Qwoom-ASR\node-portable\node.exe" (set "QVUNA_NODE=E:\Qwoom-ASR\node-portable\node.exe" & goto have_node)
if exist "%~dp0node-portable\node.exe" (set "QVUNA_NODE=%~dp0node-portable\node.exe" & goto have_node)
where node >nul 2>nul
if errorlevel 1 goto no_node
set "QVUNA_NODE=node"
:have_node
"%QVUNA_NODE%" -e "process.exit(Number(process.versions.node.split('.')[0]) === 24 ? 0 : 2)" >nul 2>nul
if errorlevel 1 goto wrong_node
echo Ywoom Factory — http://127.0.0.1:%PORT%
if "%Ywoom_SESSION_SECRET%"=="" set "Ywoom_SESSION_SECRET=dev-secret-32-chars-long-for-proto"
"%QVUNA_NODE%" apps/api/src/server.ts
set "exitc=%errorlevel%"
if not "%exitc%"=="0" pause
exit /b %exitc%
:no_node
echo Node.js 24 not found. Install Node 24 or portable Node to E:/Qwoom-ASR/node-portable
pause
exit /b 2
:wrong_node
echo Need Node.js 24.x — found:
"%QVUNA_NODE%" --version
pause
exit /b 2
