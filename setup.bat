@echo off
REM AskMitr - Startup Script for Windows

echo.
echo ================================================
echo   AskMitr - Emotion Voice Assistant
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [✓] Python and Node.js are installed

REM Setup Python backend
echo.
echo [1/3] Setting up Python backend...
cd Server

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

if not exist "emotion_model.pth" (
    echo [WARNING] emotion_model.pth not found in Server folder
    echo Please ensure you have trained the emotion detection model
    echo or obtained a pre-trained model and placed it in Server/
)

echo Installing Python dependencies...
pip install -q -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo [WARNING] Please edit .env and add your GEMINI_API_KEY
)

echo.
echo [2/3] Setting up Node.js server...
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
)

echo.
echo ================================================
echo   Startup Complete!
echo ================================================
echo.
echo Next steps:
echo 1. Edit Server\.env and add your GEMINI_API_KEY
echo 2. Open 3 terminals and run:
echo.
echo    Terminal 1 (Python Backend):
echo    cd Server
echo    venv\Scripts\activate
echo    python -m uvicorn app_emotion:app --host 127.0.0.1 --port 8000 --reload
echo.
echo    Terminal 2 (Node.js Server):
echo    cd Server
echo    npm start
echo.
echo    Terminal 3 (Open Frontend):
echo    cd Client
echo    python -m http.server 5000
echo    Then visit: http://localhost:5000/EmotionVoiceAssistant.html
echo.
echo ================================================
pause
