<#
.SYNOPSIS
    Stop Script for DeFi Lending & Borrowing Application
.DESCRIPTION
    This script stops all running services (Hardhat node and Frontend)
    that were started by start-all.ps1
.NOTES
    Run from the project root: .\scripts\stop-all.ps1
#>

param(
    [switch]$Force
)

$ErrorActionPreference = "SilentlyContinue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ProcessInfoFile = Join-Path $ProjectRoot ".defi-processes.json"

# Colors and formatting
function Write-Header {
    param([string]$Text)
    Write-Host "`n$("═" * 60)" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "$("═" * 60)`n" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Step, [string]$Text)
    Write-Host "[$Step] " -ForegroundColor Yellow -NoNewline
    Write-Host $Text -ForegroundColor White
}

function Write-Success {
    param([string]$Text)
    Write-Host "  ✓ " -ForegroundColor Green -NoNewline
    Write-Host $Text -ForegroundColor White
}

function Write-Warning {
    param([string]$Text)
    Write-Host "  ⚠ " -ForegroundColor Yellow -NoNewline
    Write-Host $Text -ForegroundColor White
}

Write-Header "DeFi Lending & Borrowing - Shutdown"

$ProcessesStopped = 0

# Try to read saved process info
if (Test-Path $ProcessInfoFile) {
    Write-Step "1/3" "Reading process information..."
    $ProcessInfo = Get-Content $ProcessInfoFile | ConvertFrom-Json
    
    # Stop Hardhat Node
    if ($ProcessInfo.NodePid) {
        Write-Step "2/3" "Stopping Hardhat Node (PID: $($ProcessInfo.NodePid))..."
        $NodeProcess = Get-Process -Id $ProcessInfo.NodePid -ErrorAction SilentlyContinue
        if ($NodeProcess) {
            Stop-Process -Id $ProcessInfo.NodePid -Force
            Write-Success "Hardhat node stopped"
            $ProcessesStopped++
        } else {
            Write-Warning "Hardhat node process not found (may have already stopped)"
        }
    }
    
    # Stop Frontend
    if ($ProcessInfo.FrontendPid) {
        Write-Step "3/3" "Stopping Frontend (PID: $($ProcessInfo.FrontendPid))..."
        $FrontendProcess = Get-Process -Id $ProcessInfo.FrontendPid -ErrorAction SilentlyContinue
        if ($FrontendProcess) {
            Stop-Process -Id $ProcessInfo.FrontendPid -Force
            Write-Success "Frontend stopped"
            $ProcessesStopped++
        } else {
            Write-Warning "Frontend process not found (may have already stopped)"
        }
    }
    
    # Cleanup process info file
    Remove-Item $ProcessInfoFile -Force
    Write-Success "Cleaned up process tracking file"
} else {
    Write-Warning "No process tracking file found"
}

# Also try to stop any orphaned processes
Write-Host "`n" -NoNewline
Write-Step "CLEANUP" "Checking for orphaned processes..."

# Stop any node processes on port 8545
$Port8545 = Get-NetTCPConnection -LocalPort 8545 -ErrorAction SilentlyContinue
if ($Port8545) {
    foreach ($conn in $Port8545) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Success "Stopping process on port 8545: $($process.ProcessName) (PID: $($process.Id))"
            Stop-Process -Id $process.Id -Force
            $ProcessesStopped++
        }
    }
}

# Stop any node processes on port 3000
$Port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($Port3000) {
    foreach ($conn in $Port3000) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Success "Stopping process on port 3000: $($process.ProcessName) (PID: $($process.Id))"
            Stop-Process -Id $process.Id -Force
            $ProcessesStopped++
        }
    }
}

# Summary
Write-Header "Shutdown Complete!"

if ($ProcessesStopped -gt 0) {
    Write-Host "✓ " -ForegroundColor Green -NoNewline
    Write-Host "Stopped $ProcessesStopped process(es)" -ForegroundColor White
} else {
    Write-Host "ℹ " -ForegroundColor Blue -NoNewline
    Write-Host "No running processes found" -ForegroundColor White
}

Write-Host "`nPorts 8545 and 3000 are now available." -ForegroundColor Gray
Write-Host "Run " -NoNewline
Write-Host ".\scripts\start-all.ps1" -ForegroundColor Cyan -NoNewline
Write-Host " to restart services.`n"
