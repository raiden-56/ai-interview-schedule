# ============================================================
# Interview Platform - Development Startup Script
# Run this once to start all three services in separate windows
# ============================================================

$root = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Interview Platform - Dev Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if prisma dev is already running (port 51213)
$prismaRunning = netstat -ano 2>$null | Select-String ":51213" | Select-Object -First 1
if ($prismaRunning) {
    Write-Host "[DB]      prisma dev already running on :51213" -ForegroundColor Green
} else {
    Write-Host "[DB]      Starting prisma dev (local database)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$env:NODE_TLS_REJECT_UNAUTHORIZED='0'; Set-Location '$root\backend'; Write-Host 'Starting prisma dev...' -ForegroundColor Blue; npx prisma dev"
    ) -WindowStyle Normal
    Write-Host "[DB]      Waiting 6s for database to be ready..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 6
}

# 2. Check if backend is already running (port 5000)
$backendRunning = netstat -ano 2>$null | Select-String ":5000 " | Select-Object -First 1
if ($backendRunning) {
    Write-Host "[API]     Backend already running on :5000" -ForegroundColor Green
} else {
    Write-Host "[API]     Starting backend API server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$env:NODE_TLS_REJECT_UNAUTHORIZED='0'; Set-Location '$root\backend'; Write-Host 'Starting backend...' -ForegroundColor Green; npm run dev"
    ) -WindowStyle Normal
    Write-Host "[API]     Waiting 4s for backend to be ready..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 4
}

# 3. Check if frontend is already running (port 5173)
$frontendRunning = netstat -ano 2>$null | Select-String ":5173 " | Select-Object -First 1
if ($frontendRunning) {
    Write-Host "[UI]      Frontend already running on :5173" -ForegroundColor Green
} else {
    Write-Host "[UI]      Starting frontend dev server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$root\frontend'; Write-Host 'Starting frontend...' -ForegroundColor Cyan; npm run dev"
    ) -WindowStyle Normal
    Write-Host "[UI]      Waiting 3s for frontend to be ready..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Database  : prisma dev on :51213" -ForegroundColor Blue
Write-Host "  Backend   : http://localhost:5000" -ForegroundColor Green
Write-Host "  Frontend  : http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Open: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
