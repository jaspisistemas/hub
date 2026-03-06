@echo off
REM Chama o script PowerShell (mais simples e confiavel)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-deploy.ps1"
if errorlevel 1 pause
