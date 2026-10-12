@echo off
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
