# OneClick Hub — single install entrypoint (Windows PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "OneClick Hub setup — delegating to npm run setup:all"
npm run setup:all -- @args
