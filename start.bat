@echo off
echo Starting WaterFlow Application...
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found. Starting application...
echo.

echo Starting both server and client...
npm run dev

pause 