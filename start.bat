@echo off
echo ========================================
echo   Fanfiction Manager
echo   Starting the application...
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python 3.8 or higher:
    echo   1. Visit https://www.python.org/downloads/
    echo   2. Download and run the installer
    echo   3. IMPORTANT: Check "Add Python to PATH" during installation
    echo   4. Restart this terminal after installation
    echo.
    echo See INSTALL_PYTHON.md for detailed instructions.
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
python -m pip show Flask >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        echo.
        echo Try running: python -m pip install --user -r requirements.txt
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

echo.
echo [2/3] Starting backend server...
cd backend
start "Fanfiction Manager - Backend" cmd /k "python app.py"

echo.
echo [3/3] Opening application in browser...
timeout /t 3 /nobreak >nul
start http://localhost:5000

echo.
echo ========================================
echo   Application is running!
echo   
echo   URL: http://localhost:5000
echo   
echo   To stop the server:
echo   - Close the backend terminal window
echo   - Or press Ctrl+C in the terminal
echo ========================================
echo.
pause
