# OneClick Hub — Windows setup entrypoint (run from this repo folder)
# Usage:
#   cd C:\Users\Mobar\Shopify
#   .\setup.ps1
#   .\setup.ps1 --link-store
$ErrorActionPreference = "Stop"
& "$PSScriptRoot\scripts\install-oneclick-hub.ps1" @args
