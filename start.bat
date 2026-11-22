@echo off
title EBS DATA ENTRY SYSTEM - DEO Marthandam
echo =========================================================
echo   Starting EBS DATA ENTRY SYSTEM Server...
echo   District Educational Office (Secondary) Marthandam
echo =========================================================
cd /d "%~dp0"

echo [1/2] Launching server on http://localhost:3000 ...
start "" http://localhost:3000

echo [2/2] Running backend node server...
node server.js

pause

