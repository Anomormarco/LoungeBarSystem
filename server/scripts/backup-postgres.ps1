param(
  [string]$OutputDir = ".\backups",
  [string]$ContainerName = "lounge_db",
  [string]$DatabaseUser = "loungebar_user",
  [string]$DatabaseName = "loungebar",
  [string]$DatabaseUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $OutputDir "loungebar-$timestamp.dump"

if ($DatabaseUrl) {
  Write-Host "Creating remote PostgreSQL backup..."
  docker run --rm postgres:16-alpine pg_dump --format=custom --no-owner --no-acl $DatabaseUrl > $backupFile
} else {
  Write-Host "Creating local Docker PostgreSQL backup..."
  docker exec $ContainerName pg_dump -U $DatabaseUser -d $DatabaseName --format=custom --no-owner --no-acl > $backupFile
}

if (-not (Test-Path $backupFile) -or ((Get-Item $backupFile).Length -eq 0)) {
  throw "Backup file was not created or is empty."
}

Write-Host "Backup created: $backupFile"
