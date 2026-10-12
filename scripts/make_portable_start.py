import pathlib
start_content = r'''@echo off
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
'''
pathlib.Path('scripts/START_portable.cmd').write_text(start_content, encoding='utf-8')
print('wrote', len(start_content))
# Also prepare SETUP portable variant that passes --runtime-base
setup_content = r'''@echo off
setlocal
cd /d "%~dp0"
rem Portable base E:/Ywoom-ASR - short path <=120
if "%~1"=="--check" (
  python -I -X utf8 scripts\companion_asr_install.py --runtime-base "E:\Ywoom-ASR" --check 2>nul || python -I -X utf8 scripts\companion_asr_install.py
  exit /b %errorlevel%
)
where python >nul 2>nul
if errorlevel 1 goto no_python
python -I -X utf8 scripts\companion_asr_install.py --runtime-base "E:\Ywoom-ASR"
if errorlevel 1 goto failed
if /I "%~1"=="--check" exit /b 0
if not "%~1"=="" goto failed
echo This downloads the Russian model from alphacephei.com and dependencies from PyPI.
echo Runtime directory: E:\Ywoom-ASR (also uses local-asr-setup.json if present)
echo No admin, microphone access or paid API calls.
echo Read README.md and bootstrap\COMPANION_ASR_PILOT.md first.
choice /C YN /N /M "Download and install the local ASR environment to E:\Ywoom-ASR? [Y/N] "
if errorlevel 2 exit /b 0
if not errorlevel 1 exit /b 2
python -I -X utf8 scripts\companion_asr_install.py --install-local-asr --runtime-base "E:\Ywoom-ASR"
set "Ywon_exit=%errorlevel%"
pause
exit /b %Ywon_exit%
:no_python
echo Python 3.10-3.14 x64 was not found. See README.md and https://www.python.org/
:failed
echo Setup did not complete. Keep the error for review; do not disable checks.
pause
exit /b 2
'''
pathlib.Path('scripts/SETUP-ASR_portable.cmd').write_text(setup_content, encoding='utf-8')
print('setup wrote', len(setup_content))
