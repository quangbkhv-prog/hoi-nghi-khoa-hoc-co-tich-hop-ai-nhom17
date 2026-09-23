@echo off
title Conference AI - Backend
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
  py -m venv .venv
  .venv\Scripts\python.exe -m pip install -r requirements.txt
)
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
