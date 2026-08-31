param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [switch]$RequireSsl,
  [switch]$SkipSeed,
  [switch]$IncludeGateSeed
)

$ErrorActionPreference = "Stop"

if (-not $DatabaseUrl) {
  throw "DATABASE_URL is required. Pass -DatabaseUrl or set the DATABASE_URL environment variable."
}

$repoServerDir = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location $repoServerDir
try {
  $env:DATABASE_URL = $DatabaseUrl

  if ($RequireSsl) {
    $env:DATABASE_REQUIRE_SSL = "true"
    if (-not $env:DATABASE_SSL_MODE) {
      $env:DATABASE_SSL_MODE = "require"
    }
    if (-not $env:DATABASE_SSL_REJECT_UNAUTHORIZED) {
      $env:DATABASE_SSL_REJECT_UNAUTHORIZED = "true"
    }
  }

  Write-Host "Generating Prisma client..."
  npx prisma generate --schema=./prisma/schema.prisma
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  Write-Host "Applying database migrations..."
  node scripts/apply-migrations-with-pg.js
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  if (-not $SkipSeed) {
    Write-Host "Seeding restaurants, tables, menu items, owners, and admin..."
    node scripts/seed-restaurants.js
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }

    if ($IncludeGateSeed) {
      Write-Host "Seeding Gate lounges..."
      node scripts/seed-gate2.js
      if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
      }
    }
  }

  Write-Host "Source restore completed."
}
finally {
  Pop-Location
}
