# Start backend only if not already healthy (avoids Docker name conflicts).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Test-ApiHealth {
  try {
    $resp = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 3
    return $resp.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Start-ExistingCnipContainers {
  $order = @("cnip-postgres", "cnip-redis", "cnip-inference", "cnip-api")
  foreach ($name in $order) {
    $running = docker ps --filter "name=^/${name}$" --format "{{.Names}}" 2>$null
    if ($running -ne $name) {
      docker start $name 2>$null | Out-Null
    }
  }
}

if (Test-ApiHealth) {
  Write-Host "Backend already running at http://localhost:8000"
  exit 0
}

Write-Host "Backend not reachable - starting containers..."
Start-ExistingCnipContainers
Start-Sleep -Seconds 3

if (Test-ApiHealth) {
  Write-Host "Backend started (reused existing containers)."
  exit 0
}

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example"
}

$up = docker compose up -d --build postgres redis api inference 2>&1
if ($LASTEXITCODE -ne 0) {
  if ($up -match "already in use") {
    Write-Host ""
    Write-Host "Docker container name conflict detected."
    Write-Host "Run:  npm run dev:cleanup"
    Write-Host "Then: npm run dev:backend"
    exit 1
  }
  Write-Host $up
  exit $LASTEXITCODE
}

Write-Host "Waiting for API..."
for ($i = 0; $i -lt 30; $i++) {
  if (Test-ApiHealth) {
    Write-Host "Backend ready at http://localhost:8000"
    exit 0
  }
  Start-Sleep -Seconds 2
}

Write-Warning "API not healthy yet. Check docker ps."
exit 1
