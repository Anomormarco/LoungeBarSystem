if (-not $env:DATABASE_URL) {
  $env:DATABASE_URL = 'postgresql://loungebar_user:loungebar_password@localhost:5433/loungebar'
}

Set-Location $PSScriptRoot
npx.cmd prisma studio --schema=.\prisma\schema.prisma --port 5555 --browser none
