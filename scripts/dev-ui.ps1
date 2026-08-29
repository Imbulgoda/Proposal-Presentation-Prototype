# Frontend prototype (no Docker required for the UI dev server).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $Root "client")

# Free port 3000 from a previous dev server.$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) {
  $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
  if ($proc -and $proc.ProcessName -eq "node") {
    Stop-Process -Id $proc.Id -Force
    Write-Host "Stopped previous dev server on port 3000."
  }
}

Write-Host ""
Write-Host "Frontend prototype at http://localhost:3000"
Write-Host "Start the API separately if pages need live data (npm run dev:backend)."if (-not (Test-Path "node_modules")) {
  npm install
}
npm run dev
