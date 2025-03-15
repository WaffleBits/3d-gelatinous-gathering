@echo off
echo ========================================
echo    3D Agar.io Game Launcher (Alternative)
echo ========================================
echo.

echo Setting up environment...
:: Set Node options for better performance
set NODE_OPTIONS=--max-old-space-size=4096

:: Create temporary batch files
echo @echo off > temp_next.bat
echo echo Starting Next.js server... >> temp_next.bat
echo cd /d "%~dp0" >> temp_next.bat
echo npx next dev >> temp_next.bat
echo pause >> temp_next.bat

echo @echo off > temp_server.bat
echo echo Starting multiplayer server... >> temp_server.bat
echo cd /d "%~dp0" >> temp_server.bat
echo node server.js >> temp_server.bat
echo pause >> temp_server.bat

echo.
echo Starting servers...
start "Next.js Server" cmd /c temp_next.bat
start "Multiplayer Server" cmd /c temp_server.bat

echo.
echo ========================================
echo Both servers starting! Please wait...
echo.
echo Game will be available at: http://localhost:3000
echo.
echo PERFORMANCE TIPS:
echo - Use LOW quality setting for best performance
echo - Your RTX 3080 should handle MEDIUM quality well
echo - For best FPS, close other applications while playing
echo.
echo CAMERA SETTINGS:
echo - Static camera with minimal smoothing
echo - Dynamic zoom based on player size
echo - Only height has slight 0.05s smoothing
echo ========================================
echo.
echo Cleaning up temporary files in 5 seconds...
timeout /t 5 > nul
del temp_next.bat
del temp_server.bat

echo Press any key to exit this window...
pause > nul 