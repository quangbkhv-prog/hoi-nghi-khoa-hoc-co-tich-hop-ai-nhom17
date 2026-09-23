@echo off
title Conference AI - Frontend
cd /d "%~dp0frontend"
if not exist "node_modules" call npm install
call npm run dev -- --host 0.0.0.0 --port 5173
pause
