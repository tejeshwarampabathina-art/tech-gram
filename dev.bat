@echo off
echo Starting Techgram Development Environment...

start "Backend Server" cmd /c "cd backend && python app.py"
start "Frontend Server" cmd /c "npm run dev"

echo Servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause
