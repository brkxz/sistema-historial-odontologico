# =============================================================
# Script de inicio local — Sistema de Historial Odontologico
# Uso: .\start-dev.ps1
# Abre DOS terminales: una para el servidor (puerto 3001)
#                      y otra para el cliente (puerto 5173)
# =============================================================

Write-Host ""
Write-Host "=== Sistema de Historial Odontologico - Inicio Local ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Abriendo servidor backend en nueva ventana (puerto 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'c:\Users\braya\Sistema de Historial O dontologico\server'; node server.js"

Start-Sleep -Seconds 2

Write-Host "Abriendo cliente frontend en nueva ventana (puerto 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'c:\Users\braya\Sistema de Historial O dontologico\client'; npm run dev"

Write-Host ""
Write-Host "Listo. Abre tu navegador en: http://localhost:5173" -ForegroundColor Cyan
Write-Host "El backend corre en:         http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
