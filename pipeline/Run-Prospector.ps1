# ============================================================
# Brochure as a Service — Lead Prospector Runner
# ============================================================
#
# USAGE:
#   .\Run-Prospector.ps1              # Auto-picks next search from rotation
#   .\Run-Prospector.ps1 -Suburb "Sandton" -Industry "plumber"  # Manual pick
#   .\Run-Prospector.ps1 -Stats       # Show tracker stats
#   .\Run-Prospector.ps1 -List        # Show next 10 searches
#   .\Run-Prospector.ps1 -DryRun      # Search but don't write to spreadsheet
#   .\Run-Prospector.ps1 -Burst 3     # Run 3 searches back to back
#
# ============================================================

param(
    [string]$Suburb,
    [string]$Industry,
    [string]$Province = "Gauteng",
    [string]$Category = "Trades & Home Services",
    [int]$Max = 15,
    [switch]$Stats,
    [switch]$List,
    [switch]$DryRun,
    [int]$Burst = 1
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PythonScript = Join-Path $ScriptDir "prospector.py"

# Check Python is available
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command python3 -ErrorAction SilentlyContinue
}
if (-not $python) {
    Write-Host ""
    Write-Host "  [ERROR] Python not found on PATH." -ForegroundColor Red
    Write-Host "  Install Python from https://python.org and make sure it's on your PATH."
    Write-Host ""
    exit 1
}
$py = $python.Source

# Check config exists
$configPath = Join-Path $ScriptDir "config.json"
if (-not (Test-Path $configPath)) {
    Write-Host ""
    Write-Host "  [SETUP NEEDED] config.json not found." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Quick setup:"
    Write-Host "  1. Copy config.example.json to config.json"
    Write-Host "  2. Paste your Google Places API key"
    Write-Host ""

    $copy = Read-Host "  Copy config.example.json now? (Y/n)"
    if ($copy -ne "n") {
        Copy-Item (Join-Path $ScriptDir "config.example.json") $configPath
        Write-Host ""
        Write-Host "  Done! Now edit config.json and add your API key." -ForegroundColor Green
        Write-Host "  Then run this script again."
        Write-Host ""

        # Open in default editor
        Start-Process $configPath
    }
    exit 0
}

# Build args
if ($Stats) {
    & $py $PythonScript --stats
    exit
}

if ($List) {
    & $py $PythonScript --list
    exit
}

# Run the prospector (supports burst mode)
for ($i = 1; $i -le $Burst; $i++) {
    if ($Burst -gt 1) {
        Write-Host ""
        Write-Host "  ========================================" -ForegroundColor Cyan
        Write-Host "  RUN $i of $Burst" -ForegroundColor Cyan
        Write-Host "  ========================================" -ForegroundColor Cyan
    }

    $args_list = @("--max", $Max)

    if ($Suburb -and $Industry) {
        $args_list += @("--suburb", $Suburb, "--industry", $Industry, "--province", $Province, "--category", $Category)
    }

    if ($DryRun) {
        $args_list += "--dry-run"
    }

    & $py $PythonScript @args_list

    # Small delay between burst runs to be nice to the API
    if ($i -lt $Burst) {
        Write-Host "  Waiting 3 seconds before next run..." -ForegroundColor DarkGray
        Start-Sleep -Seconds 3
    }
}

# Show a quick summary at the end of burst
if ($Burst -gt 1) {
    Write-Host ""
    Write-Host "  ========================================" -ForegroundColor Green
    Write-Host "  BURST COMPLETE - $Burst runs finished" -ForegroundColor Green
    Write-Host "  ========================================" -ForegroundColor Green
    Write-Host ""
    & $py $PythonScript --stats
}
