@echo off
echo Starting WaterFlow Application...
echo.

echo Stopping any existing processes on ports 5000 and 3000...
npx kill-port 5000 3000 >nul 2>&1

echo.
echo Starting the application...
npm run dev

pause 