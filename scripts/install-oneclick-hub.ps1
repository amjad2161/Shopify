# OneClick Hub — single install entrypoint (Windows PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path -LiteralPath (Join-Path $Root "package.json"))) {
  Write-Host ""
  Write-Host "ERROR: package.json not found in $Root" -ForegroundColor Red
  Write-Host ""
  Write-Host "You ran setup from the wrong folder. npm looks for package.json in the current directory."
  Write-Host ""
  Write-Host "Fix:"
  Write-Host "  1. Clone the repo (if you have not yet):"
  Write-Host "       cd `$HOME"
  Write-Host "       git clone https://github.com/amjad2161/Shopify.git"
  Write-Host "  2. Go into the project folder, then run setup:"
  Write-Host "       cd Shopify"
  Write-Host "       .\setup.ps1 --link-store"
  Write-Host ""
  Write-Host "Or from the project folder:"
  Write-Host "       npm run setup:all -- --link-store"
  Write-Host ""
  exit 1
}

Write-Host "OneClick Hub setup — project: $Root"
Write-Host "Delegating to npm run setup:all"
npm run setup:all -- @args
