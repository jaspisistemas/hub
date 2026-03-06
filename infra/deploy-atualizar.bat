@echo off
REM Chama o script PowerShell (mais estavel, evita janela fechar durante download/npm)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-atualizar.ps1" %*
if errorlevel 1 pause
exit
