@echo off
setlocal
cd /d "%~dp0"
if errorlevel 1 (
  echo Extract this folder to a local drive such as Downloads before running.
  pause
  exit /b 1
)
echo AutoStock setup - internet access is needed to install dependencies.
echo Existing configuration and database will be preserved.
echo.
if exist ".venv\Scripts\python.exe" goto existing
python -c "import sys; sys.exit(0 if sys.version_info >= (3,12) else 1)" >nul 2>nul
if not errorlevel 1 goto python
py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3,12) else 1)" >nul 2>nul
if not errorlevel 1 goto py
echo Python 3.12 or newer was not found. Install it from python.org.
goto failed
:existing
".venv\Scripts\python.exe" launcher.py setup
goto finished
:python
python launcher.py setup
goto finished
:py
py -3 launcher.py setup
:finished
if errorlevel 1 goto failed
echo.
pause
exit /b 0
:failed
echo.
echo Setup did not finish. Read the error above.
echo If the virtual environment is broken, rename only .venv to .venv-old and retry.
echo Keep backend/.env and the database unchanged.
pause
exit /b 1
