# Missing Frame - install script (PowerShell)
# Run from: missing-frame-site/

Write-Host "=== Missing Frame - Install ===" -ForegroundColor Cyan

Write-Host "[1/5] Starting PostgreSQL + Redis..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "Waiting 15 seconds for DB to start..." -ForegroundColor Gray
Start-Sleep -Seconds 15

Write-Host "[2/5] Backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; exit 1 }

Write-Host "[3/5] Database schema + seed..." -ForegroundColor Yellow
npx prisma db push
npx prisma generate
npx prisma db seed

Write-Host "[4/5] Frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; exit 1 }

Set-Location ..

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Run in two terminals:"
Write-Host "  Terminal 1: cd backend  && npm run start:dev"
Write-Host "  Terminal 2: cd frontend && npm run dev"
