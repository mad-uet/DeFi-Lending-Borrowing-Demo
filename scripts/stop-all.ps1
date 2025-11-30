<#
.SYNOPSIS
    Stop Script for DeFi Lending and Borrowing Application
.DESCRIPTION
    This script stops all running services (Hardhat node and Frontend)
    that were started by start-all.ps1. It checks across Windows Terminal,
    PowerShell, and Command Prompt processes.
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
    $line = "=" * 60
    Write-Host ""
    Write-Host $line -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host $line -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Step, [string]$Text)
    Write-Host "[$Step] " -ForegroundColor Yellow -NoNewline
    Write-Host $Text -ForegroundColor White
}

function Write-Success {
    param([string]$Text)
    Write-Host "  [OK] " -ForegroundColor Green -NoNewline
    Write-Host $Text -ForegroundColor White
}

function Write-WarnMsg {
    param([string]$Text)
    Write-Host "  [!] " -ForegroundColor Yellow -NoNewline
    Write-Host $Text -ForegroundColor White
}

function Stop-ProcessOnPort {
    param([int]$Port)
    $stopped = 0
    $checkedPids = @{}
    
    # Method 1: Using Get-NetTCPConnection
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $pid = $conn.OwningProcess
                if ($pid -gt 0 -and -not $checkedPids.ContainsKey($pid)) {
                    $checkedPids[$pid] = $true
                    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    if ($proc) {
                        Write-Success "Stopping $($proc.ProcessName) on port $Port (PID: $pid)"
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        $stopped++
                    }
                }
            }
        }
    } catch {
        # Ignore errors
    }
    
    # Method 2: Using netstat as fallback - with timeout
    try {
        $job = Start-Job -ScriptBlock { netstat -ano 2>$null }
        $completed = Wait-Job $job -Timeout 3
        if ($completed) {
            $netstatOutput = Receive-Job $job | Select-String ":$Port\s"
            foreach ($line in $netstatOutput) {
                if ($line -match '\s(\d+)\s*$') {
                    $pid = [int]$Matches[1]
                    if ($pid -gt 0 -and -not $checkedPids.ContainsKey($pid)) {
                        $checkedPids[$pid] = $true
                        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                        if ($proc) {
                            Write-Success "Stopping $($proc.ProcessName) on port $Port (PID: $pid) [netstat]"
                            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                            $stopped++
                        }
                    }
                }
            }
        }
        Remove-Job $job -Force -ErrorAction SilentlyContinue
    } catch {
        # Ignore errors
    }
    
    return $stopped
}

function Stop-NodeProcesses {
    $stopped = 0
    
    # Find and stop node.exe processes running hardhat or next
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    foreach ($proc in $nodeProcesses) {
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
            if ($cmdLine -match "hardhat|next") {
                Write-Success "Stopping node process: $($proc.Id) - $cmdLine"
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                $stopped++
            }
        } catch {
            # Skip if we can't get command line
        }
    }
    
    return $stopped
}

function Stop-TerminalProcesses {
    param([int]$ParentPid)
    $stopped = 0
    
    if ($ParentPid -le 0) { return 0 }
    
    # Get all child processes of the parent (handles Windows Terminal spawning)
    $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ParentPid" -ErrorAction SilentlyContinue
    foreach ($child in $children) {
        # Recursively stop children first
        $stopped += Stop-TerminalProcesses -ParentPid $child.ProcessId
        
        $proc = Get-Process -Id $child.ProcessId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Success "Stopping child process: $($proc.ProcessName) (PID: $($child.ProcessId))"
            Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue
            $stopped++
        }
    }
    
    # Stop the parent itself
    $parentProc = Get-Process -Id $ParentPid -ErrorAction SilentlyContinue
    if ($parentProc) {
        Stop-Process -Id $ParentPid -Force -ErrorAction SilentlyContinue
        $stopped++
    }
    
    return $stopped
}

Write-Header "DeFi Lending and Borrowing - Shutdown"

$ProcessesStopped = 0

# Step 1: Try to read saved process info and stop by PID tree
Write-Step "1/4" "Checking saved process information..."

if (Test-Path $ProcessInfoFile) {
    $ProcessInfo = Get-Content $ProcessInfoFile | ConvertFrom-Json
    
    if ($ProcessInfo.NodePid) {
        Write-Step "    " "Stopping Hardhat Node tree (PID: $($ProcessInfo.NodePid))..."
        $ProcessesStopped += Stop-TerminalProcesses -ParentPid $ProcessInfo.NodePid
    }
    
    if ($ProcessInfo.FrontendPid) {
        Write-Step "    " "Stopping Frontend tree (PID: $($ProcessInfo.FrontendPid))..."
        $ProcessesStopped += Stop-TerminalProcesses -ParentPid $ProcessInfo.FrontendPid
    }
    
    Remove-Item $ProcessInfoFile -Force -ErrorAction SilentlyContinue
    Write-Success "Cleaned up process tracking file"
} else {
    Write-WarnMsg "No process tracking file found - will scan for processes"
}

# Step 2: Stop processes by port (most reliable method)
Write-Step "2/4" "Checking port 8545 (Hardhat node)..."
$ProcessesStopped += Stop-ProcessOnPort -Port 8545

Write-Step "3/4" "Checking port 3000 (Frontend)..."
$ProcessesStopped += Stop-ProcessOnPort -Port 3000

# Step 3: Find any remaining node processes running our apps
Write-Step "4/4" "Scanning for remaining node processes..."
$ProcessesStopped += Stop-NodeProcesses

# Also check for any powershell/cmd windows with our title
$shellProcesses = Get-Process -Name "powershell", "pwsh", "cmd", "WindowsTerminal" -ErrorAction SilentlyContinue
foreach ($proc in $shellProcesses) {
    try {
        $title = $proc.MainWindowTitle
        if ($title -match "Hardhat|DeFi Frontend|hardhat node") {
            Write-Success "Stopping shell with matching title: $title (PID: $($proc.Id))"
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $ProcessesStopped++
        }
    } catch {
        # Skip if we can't get window title
    }
}

# Summary
Write-Header "Shutdown Complete!"

if ($ProcessesStopped -gt 0) {
    Write-Host "[OK] " -ForegroundColor Green -NoNewline
    Write-Host "Stopped $ProcessesStopped process(es)" -ForegroundColor White
} else {
    Write-Host "[i] " -ForegroundColor Blue -NoNewline
    Write-Host "No running processes found" -ForegroundColor White
}

# Final verification
Start-Sleep -Milliseconds 500
$port8545Still = Get-NetTCPConnection -LocalPort 8545 -ErrorAction SilentlyContinue
$port3000Still = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

Write-Host ""
if ($port8545Still -or $port3000Still) {
    Write-Host "[!] " -ForegroundColor Yellow -NoNewline
    Write-Host "Some ports may still be in use. Try running with -Force or wait a moment." -ForegroundColor White
} else {
    Write-Host "Ports 8545 and 3000 are now available." -ForegroundColor Gray
}
Write-Host "Run .\scripts\start-all.ps1 to restart services."
Write-Host ""
