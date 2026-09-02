# Stop CNIP containers started from any folder (fixes name conflicts when project moved).
$ErrorActionPreference = "SilentlyContinue"
$names = @("cnip-web", "cnip-api", "cnip-inference", "cnip-worker", "cnip-postgres", "cnip-redis")
$stopped = @()

foreach ($name in $names) {
  $exists = docker ps -a --filter "name=^/${name}$" --format "{{.Names}}" 2>$null
  if ($exists -eq $name) {
    docker stop $name 2>$null | Out-Null
    docker rm $name 2>$null | Out-Null
    $stopped += $name
  }
}

if ($stopped.Count -gt 0) {
  Write-Host "Removed containers: $($stopped -join ', ')"
} else {
  Write-Host "No CNIP containers to remove."
}

# Free port 3000 if a stray Node dev server is listening.
$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) {
  $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
  if ($proc -and $proc.ProcessName -eq "node") {
    Stop-Process -Id $proc.Id -Force
    Write-Host "Stopped Node process on port 3000 (PID $($proc.Id))."
  } else {
    Write-Warning "Port 3000 is in use by $($proc.ProcessName) (PID $($conn.OwningProcess)). Stop it manually."
  }
} else {
  Write-Host "Port 3000 is free."
}
