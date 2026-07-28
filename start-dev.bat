@echo off
cd /d "%~dp0"
title Nexum Intelligence - Dev Server
echo ============================================
echo  Starting Nexum Intelligence dev server...
echo  URL: http://127.0.0.1:5173
echo ============================================
echo.
call npm run dev
echo.
echo Dev server stopped. Press any key to close.
pause >nul
