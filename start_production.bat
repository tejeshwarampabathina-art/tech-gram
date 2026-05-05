@echo off
echo Building the Vite frontend...
call npm run build

echo.
echo Starting the Python Flask backend...
cd backend
python app.py
