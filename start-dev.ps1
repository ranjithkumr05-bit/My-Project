# Start both backend and frontend servers for Customwear Platform
# This script ensures servers are properly bound for WiFi/network access

$ErrorActionPreference = "Stop"

$platformDir = "C:\Users\SURENDHAR\.cline\data\workspaces\chat\customwear-platform"
$frontendDir = "$platformDir\frontend"

Write-Host "=== Customwear Platform Startup ===" -ForegroundColor Cyan

# Check/install dependencies
Write-Host "`n[1/4] Checking node_modules..." -ForegroundColor Yellow
if (-not (Test-Path "$platformDir\node_modules")) {
    Write-Host "  Installing dependencies..."
    Set-Location $platformDir
    npm install
} else {
    Write-Host "  node_modules exists" -ForegroundColor Green
}

# Kill any existing processes on our ports
Write-Host "`n[2/4] Clearing ports 4300 and 5174..." -ForegroundColor Yellow
$ports = @(4300, 5174)
foreach ($port in $ports) {
    $pid = netstat -ano | Select-String "$port" | Select-String "LISTENING" | ForEach-Object { $_.ToString().Split()[-1] }
    if ($pid) {
        Write-Host "  Killing process $pid on port $port"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 1

# Start backend
Write-Host "`n[3/4] Starting backend on port 4300..." -ForegroundColor Yellow
Set-Location $platformDir
$backend = Start-Process node -ArgumentList "server.mjs" -WorkingDirectory $platformDir -PassThru -WindowStyle Normal
Write-Host "  Backend PID: $($backend.Id)" -ForegroundColor Green

Start-Sleep -Seconds 2

# Start frontend with network binding
Write-Host "`n[4/4] Starting frontend on port 5174 (bound to 0.0.0.0)..." -ForegroundColor Yellow
Set-Location $frontendDir
$frontend = Start-Process npx -ArgumentList "vite --host 0.0.0.0 --port 5174" -WorkingDirectory $frontendDir -PassThru -WindowStyle Normal
Write-Host "  Frontend PID: $($frontend.Id)" -ForegroundColor Green

Start-Sleep -Seconds 3

# Verify
Write-Host "`n=== Verification ===" -ForegroundColor Cyan
$running = $true

# Check backend
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:4300/" -TimeoutSec 3 -UseBasicParsing
    Write-Host "  Backend (4300): OK ($($resp.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  Backend (4300): FAILED" -ForegroundColor Red
    $running = $false
}

# Check frontend
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:5174/" -TimeoutSec 3 -UseBasicParsing
    Write-Host "  Frontend (5174): OK ($($resp.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  Frontend (5174): FAILED" -ForegroundColor Red
    $running = $false
}

Write-Host "`n=== Access URLs ===" -ForegroundColor Cyan
Write-Host "  Local:   http://localhost:5174 (frontend)"
Write-Host "  Network: http://192.168.1.8:5174 (frontend via WiFi)"
Write-Host "  API:     http://localhost:4300 (backend)"

if ($running) {
    Write-Host "`n✅ Both servers running successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Some servers failed to start. Check the windows that opened." -ForegroundColor Red
}
