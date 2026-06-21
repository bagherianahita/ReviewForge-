# One-command local demo for reviewers (Windows PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host ""
Write-Host "  ReviewForge - starting demo stack"
Write-Host "  Requires: Docker Desktop"
Write-Host ""

if (Test-Path ".env") {
    docker compose --env-file .env up --build
} else {
    docker compose up --build
}
