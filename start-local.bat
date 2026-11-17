@echo off
echo ========================================================
echo   Starting FinTrack Personal Finance Application
echo ========================================================

echo Starting FastAPI Backend on http://localhost:8000 ...
start "FinTrack Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting React Frontend on http://localhost:5173 ...
start "FinTrack Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application initialized!
echo - Web Dashboard:  http://localhost:5173
echo - API Docs:       http://localhost:8000/docs
echo - Demo Account:   demo@example.com / demo123456
echo ========================================================
pause
