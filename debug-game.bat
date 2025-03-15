@echo off
echo ========================================
echo Starting 3D Agario with debugging enabled
echo ========================================

REM Create debug-logs directory if it doesn't exist
if not exist "debug-logs" (
  mkdir debug-logs
  echo Created debug-logs directory
)

REM Create empty log file if it doesn't exist
if not exist "debug-logs\game-log.txt" (
  echo [%date% %time%] [System] Initialization: Log file created by debug-game.bat > debug-logs\game-log.txt
  echo Created initial log file
)

echo.
echo Starting game server in a new window...
start cmd /k "run-game.bat"

REM Wait a moment for the game to start
timeout /t 5 > nul

echo Starting log viewer in a separate window...
start cmd /k "node scripts\view-logs.js -w"

echo.
echo ========================================
echo Debug environment started!
echo.
echo Game server is running in the first window
echo Log viewer is running in the second window
echo.
echo Visit http://localhost:3000 in your browser to play the game
echo Check the log viewer window for real-time debugging information
echo ========================================
echo.
echo Press any key to close this window...
pause > nul 