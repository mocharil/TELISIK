@echo off
setlocal
cd /d "%~dp0.."
where py >nul 2>nul
if errorlevel 1 (echo Install Python 3.10 or newer with the Windows Python launcher first. & pause & exit /b 1)
where npm >nul 2>nul
if errorlevel 1 (echo Install Node.js 20 or newer first. & pause & exit /b 1)
py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)"
if errorlevel 1 (echo Python 3.10 or newer is required. & pause & exit /b 1)
if not exist .venv\Scripts\python.exe py -3 -m venv .venv
if errorlevel 1 exit /b 1
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if errorlevel 1 (pause & exit /b 1)
if not exist node_modules call npm install
if errorlevel 1 (pause & exit /b 1)
echo Open http://localhost:5173 in your browser. Press Ctrl+C here to stop TELISIK.
call npm run dev:local -- --port 5173 --strictPort
endlocal
