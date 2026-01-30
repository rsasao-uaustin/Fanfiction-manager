#!/bin/bash

echo "========================================"
echo "  Fanfiction Manager"
echo "  Starting the application..."
echo "========================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "[1/3] Checking dependencies..."
if ! python3 -c "import flask" &> /dev/null; then
    echo "Installing dependencies..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
else
    echo "Dependencies already installed."
fi

echo
echo "[2/3] Starting backend server..."
cd backend
python3 app.py &
SERVER_PID=$!

echo
echo "[3/3] Opening application in browser..."
sleep 3

# Try to open in default browser (cross-platform)
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5000
elif command -v open &> /dev/null; then
    open http://localhost:5000
else
    echo "Please open http://localhost:5000 in your browser"
fi

echo
echo "========================================"
echo "  Application is running!"
echo "  "
echo "  URL: http://localhost:5000"
echo "  "
echo "  To stop the server:"
echo "  - Press Ctrl+C"
echo "========================================"
echo

# Wait for Ctrl+C
trap "kill $SERVER_PID; exit" INT
wait
