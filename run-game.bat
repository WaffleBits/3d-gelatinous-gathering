@echo off
echo ========================================
echo    3D Agar.io Game Launcher - Optimized
echo ========================================
echo.

echo Setting up environment...
:: Set Node options for better performance
set NODE_OPTIONS=--max-old-space-size=4096

echo.
echo Starting Next.js development server...
start "Next.js Server" cmd /c "npx next dev"

echo.
echo Starting multiplayer server...
start "Multiplayer Server" cmd /c "node server.js"

echo.
echo ========================================
echo Both servers starting! Please wait...
echo.
echo Game will be available at: http://localhost:3000
echo.
echo PERFORMANCE OPTIMIZATIONS:
echo - Separated game systems for better performance
echo - Optimized rendering pipeline and effects
echo - Added FPS counter (check browser console)
echo.
echo QUALITY SETTINGS:
echo - LOW: Maximum performance, minimal effects
echo - MEDIUM: Balanced quality and performance
echo - HIGH: Best visuals (requires good GPU)
echo.
echo CAMERA SETTINGS:
echo - Static camera with minimal smoothing
echo - Automatic zoom based on player size
echo ========================================
echo.
echo Press any key to exit this window...
pause > nul 