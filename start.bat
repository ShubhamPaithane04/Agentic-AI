@echo off
echo Starting Aizen...

start cmd /k "cd /d %~dp0backend && ..\venv\Scripts\python.exe app.py"
start cmd /k "cd /d %~dp0aizen\frontend && npm run dev"

echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
