#!/usr/bin/env pwsh
# Script para iniciar todo o projeto Jaspi Hub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INICIANDO JASPI HUB" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cores
$Success = "Green"
$Info = "Cyan"
$Warning = "Yellow"

# 1. Iniciar Redis
Write-Host "Iniciando Redis..." -ForegroundColor $Info
try {
    docker --version > $null 2>&1
    if ($?) {
        Start-Job -Name "redis" -ScriptBlock {
            Set-Location "C:\hub"
            docker-compose -f docker-compose.redis.yml up -d
        } > $null
        Write-Host "[OK] Redis iniciado" -ForegroundColor $Success
    } else {
        Write-Host "[SKIP] Docker nao instalado" -ForegroundColor $Warning
    }
} catch {
    Write-Host "[ERRO] Redis: $_" -ForegroundColor $Warning
}

# 2. Iniciar Backend
Write-Host "Iniciando Backend..." -ForegroundColor $Info
Start-Job -Name "backend" -ScriptBlock {
    Set-Location "C:\hub\backend"
    npm start 2>&1
} > $null
Write-Host "[OK] Backend iniciado" -ForegroundColor $Success

Start-Sleep -Seconds 2

# 3. Iniciar Frontend
Write-Host "Iniciando Frontend..." -ForegroundColor $Info
Start-Job -Name "frontend" -ScriptBlock {
    Set-Location "C:\hub\frontend"
    npm run dev 2>&1
} > $null
Write-Host "[OK] Frontend iniciado" -ForegroundColor $Success

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TUDO INICIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs de acesso:" -ForegroundColor $Info
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:   https://uneducated-georgiann-personifiant.ngrok-free.dev" -ForegroundColor Cyan
Write-Host "  Redis:     localhost:6379" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos uteis:" -ForegroundColor $Info
Write-Host "  Ver status:   Get-Job" -ForegroundColor Yellow
Write-Host "  Ver logs:     Get-Job -Name backend | Receive-Job -Keep" -ForegroundColor Yellow
Write-Host "  Parar tudo:   Get-Job | Stop-Job" -ForegroundColor Yellow
Write-Host ""

# Mostrar jobs
Get-Job | Format-Table Name, State, @{Name="ID";Expression={$_.Id}}
