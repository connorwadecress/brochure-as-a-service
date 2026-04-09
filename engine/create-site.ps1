# Brochure Site Generator — PowerShell Launcher
# Usage: Right-click > Run with PowerShell, or from terminal: .\create-site.ps1

# Load API key from .bashrc if not already set
if (-not $env:ANTHROPIC_API_KEY) {
    $bashrc = "$env:USERPROFILE\.bashrc"
    if (Test-Path $bashrc) {
        $match = Select-String -Path $bashrc -Pattern "ANTHROPIC_API_KEY=(.+)" | Select-Object -First 1
        if ($match) {
            $key = $match.Matches[0].Groups[1].Value.Trim().Trim('"', "'")
            $env:ANTHROPIC_API_KEY = $key
        }
    }
}

if (-not $env:ANTHROPIC_API_KEY) {
    Write-Host "ERROR: ANTHROPIC_API_KEY not found." -ForegroundColor Red
    Write-Host "Set it with: `$env:ANTHROPIC_API_KEY = 'sk-ant-...'"
    Read-Host "Press Enter to exit"
    exit 1
}

# Run the Node.js script from the engine directory
$engineDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $engineDir
try {
    node create-site.js
} finally {
    Pop-Location
}
