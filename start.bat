@echo off
title VoyageAI - Starting Servers
color 0A

echo.
echo  ==========================================
echo    VoyageAI - Starting All Servers
echo  ==========================================
echo.

:: Kill anything on ports 3000 and 5000
echo  [1/3] Clearing ports 3000 and 5000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5000 " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul

:: Start backend
echo  [2/3] Starting Backend  (http://localhost:5000)...
start "VoyageAI Backend" cmd /k "cd /d "%~dp0server" && npm run dev"
timeout /t 3 /nobreak >nul

:: Start frontend
echo  [3/3] Starting Frontend (http://localhost:3000)...
start "VoyageAI Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo  ==========================================
echo    Both servers are running!
echo    Open: http://localhost:3000
echo  ==========================================
echo.

:: Open browser automatically
start "" "http://localhost:3000"

echo  Press any key to close this window...
pause >nul
