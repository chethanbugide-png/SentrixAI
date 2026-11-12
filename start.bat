@echo off
echo ===================================================
echo     Launching SENTRIX AI Command Center Platform
echo ===================================================
echo.
echo Starting Backend daemon on http://127.0.0.1:8000 ...
start "SentrixAI Backend" cmd /k "cd /d "%~dp0backend" && python run.py"

echo Starting Frontend on http://localhost:5173 ...
start "SentrixAI Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both services launched! 
echo Frontend: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ===================================================
pause
