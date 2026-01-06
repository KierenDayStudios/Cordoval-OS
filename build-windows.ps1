# Cordoval OS - Build Script for Windows
# Run this script to build your production installer

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Cordoval OS - Build Script   " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Ask user what they want to do
Write-Host "What would you like to do?" -ForegroundColor Green
Write-Host "1. Build installer (local testing only)" -ForegroundColor White
Write-Host "2. Build and publish release to GitHub" -ForegroundColor White
Write-Host "3. Run in development mode" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Building Windows installer..." -ForegroundColor Yellow
        npm run build:win
        Write-Host ""
        Write-Host "✓ Build complete!" -ForegroundColor Green
        Write-Host "Find your installer in the 'release' folder" -ForegroundColor Cyan
    }
    "2" {
        Write-Host ""
        # Check for GitHub token
        if (-not $env:GH_TOKEN) {
            Write-Host "GitHub token not found!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please set your GitHub token:" -ForegroundColor Yellow
            Write-Host '  $env:GH_TOKEN="your_token_here"' -ForegroundColor White
            Write-Host ""
            Write-Host "Get a token at: https://github.com/settings/tokens" -ForegroundColor Cyan
            exit
        }
        
        Write-Host "Building and publishing release..." -ForegroundColor Yellow
        npm run release
        Write-Host ""
        Write-Host "✓ Release published!" -ForegroundColor Green
        Write-Host "Check your GitHub releases page" -ForegroundColor Cyan
    }
    "3" {
        Write-Host ""
        Write-Host "Starting development mode..." -ForegroundColor Yellow
        npm run dev
    }
    default {
        Write-Host ""
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
pause
