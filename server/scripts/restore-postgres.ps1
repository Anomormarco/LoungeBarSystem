param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [string]$ContainerName = "lounge_db",
  [string]$DatabaseUser = "loungebar_user",
  [string]$DatabaseName = "loungebar"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}

$containerBackup = "/tmp/loungebar-restore.dump"

Write-Host "Copying backup into container..."
docker cp $BackupFile "${ContainerName}:$containerBackup"

Write-Host "Restoring database..."
docker exec $ContainerName pg_restore `
  -U $DatabaseUser `
  -d $DatabaseName `
  --clean `
  --if-exists `
  --no-owner `
  --no-acl `
  $containerBackup

Write-Host "Restore completed."


