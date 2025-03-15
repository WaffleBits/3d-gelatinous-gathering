@echo off
echo Starting game with debugging enabled...

REM Start game in one window
start cmd /k "run-game.bat"

REM Wait a moment for the game to start
timeout /t 5 > nul

REM Open log viewer in a separate window
start cmd /k "view-logs.bat -w"

echo Debug environment started!
echo Game running in first window, log viewer in second window.
echo.
echo Press any key to close this window...
pause > nul 