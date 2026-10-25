@echo off
setlocal
cd /d "%~dp0"
if errorlevel 1 (
  echo Extract this folder to a local drive such as Downloads before running.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  echo Run setup.bat first.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" launcher.py run
if errorlevel 1 (
  echo.
  echo AutoStock did not start. Read the error above.
  pause
  exit /b 1
)
exit /b 0
