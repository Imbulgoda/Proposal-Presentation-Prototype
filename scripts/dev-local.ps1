# Fast local development on Windows (React/Next.js UI + Docker backend).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

& (Join-Path $PSScriptRoot "dev-backend.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Free port 3000 from a previous Next.js dev server.
$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) {
  $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
  if ($proc -and $proc.ProcessName -eq "node") {
    Stop-Process -Id $proc.Id -Force
    Write-Host "Stopped previous dev server on port 3000."
  }
}

Write-Host ""
Write-Host "Starting React frontend (Next.js) at http://localhost:3000"
Write-Host "Login: doctor@gmail.com / Doc123"
Set-Location (Join-Path $Root "client")
if (-not (Test-Path "node_modules")) {
  npm install
}
npm run dev
