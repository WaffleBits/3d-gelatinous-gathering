@echo off
echo Starting 3D Agar.io Game...
echo.
echo Starting Next.js server...
start cmd /k npx next dev
echo.
echo Starting multiplayer server...
start cmd /k node server.js
echo.
echo Servers started! Open your browser to http://localhost:3000 