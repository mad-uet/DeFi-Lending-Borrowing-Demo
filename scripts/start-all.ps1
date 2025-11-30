<#
.SYNOPSIS
    All-in-One Startup Script for DeFi Lending and Borrowing Application
.DESCRIPTION
    This script starts the Hardhat node, deploys contracts, copies artifacts,
    and starts the frontend - each in isolated terminal windows.
.NOTES
    Run from the project root: .\scripts\start-all.ps1
#>

param(
    [switch]$SkipDeploy,
    [switch]$SkipFrontend,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

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

function Write-ErrorMsg {
    param([string]$Text)
    Write-Host "  [X] " -ForegroundColor Red -NoNewline
    Write-Host $Text -ForegroundColor White
}

# Store process info for cleanup
$ProcessInfoFile = Join-Path $ProjectRoot ".defi-processes.json"

Write-Header "DeFi Lending and Borrowing - Startup"

# Check if node_modules exist
$RootNodeModules = Join-Path $ProjectRoot "node_modules"
$FrontendNodeModules = Join-Path $ProjectRoot "frontend\node_modules"

if (-not (Test-Path $RootNodeModules)) {
    Write-Step "SETUP" "Installing root dependencies..."
    Set-Location $ProjectRoot
    npm install
    Write-Success "Root dependencies installed"
}

if (-not (Test-Path $FrontendNodeModules)) {
    Write-Step "SETUP" "Installing frontend dependencies..."
    Set-Location (Join-Path $ProjectRoot "frontend")
    npm install
    Write-Success "Frontend dependencies installed"
}

Set-Location $ProjectRoot

# ========================================
# Step 1: Start Hardhat Node
# ========================================
Write-Step "1/4" "Starting Hardhat Node..."

$NodeCommand = "cd '$ProjectRoot'; Write-Host ''; Write-Host '=======================================' -ForegroundColor Cyan; Write-Host '  Hardhat Local Node (Chain ID: 31337)' -ForegroundColor Cyan; Write-Host '=======================================' -ForegroundColor Cyan; Write-Host ''; npx hardhat node"

$NodeProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $NodeCommand -PassThru
$NodePid = $NodeProcess.Id

Write-Success "Hardhat node started (PID: $NodePid)"
Write-Host "     Waiting for node to be ready..." -ForegroundColor Gray

# Wait for node to be ready
$MaxRetries = 30
$Retries = 0
$NodeReady = $false

while (-not $NodeReady -and $Retries -lt $MaxRetries) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8545" -Method POST -Body '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' -ContentType "application/json" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $NodeReady = $true
        }
    } catch {
        $Retries++
    }
}

if (-not $NodeReady) {
    Write-ErrorMsg "Hardhat node failed to start within 30 seconds"
    exit 1
}

Write-Success "Hardhat node is ready!"

# ========================================
# Step 2: Deploy Contracts
# ========================================
if (-not $SkipDeploy) {
    Write-Step "2/4" "Deploying contracts..."
    
    $DeployOutput = & npx hardhat run scripts/deploy-all.ts --network localhost 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Contracts deployed successfully"
        if ($Verbose) {
            Write-Host $DeployOutput -ForegroundColor Gray
        }
    } else {
        Write-ErrorMsg "Contract deployment failed"
        Write-Host $DeployOutput -ForegroundColor Red
        exit 1
    }
} else {
    Write-Step "2/4" "Skipping deployment (SkipDeploy flag set)"
}

# ========================================
# Step 3: Copy Artifacts to Frontend
# ========================================
Write-Step "3/4" "Copying artifacts to frontend..."

$CopyOutput = & npx ts-node scripts/copy-artifacts-to-frontend.ts 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Success "Artifacts copied to frontend"
} else {
    Write-ErrorMsg "Failed to copy artifacts"
    Write-Host $CopyOutput -ForegroundColor Red
}

# ========================================
# Step 4: Start Frontend
# ========================================
if (-not $SkipFrontend) {
    Write-Step "4/4" "Starting Frontend (Next.js with Turbopack)..."
    
    $FrontendPath = Join-Path $ProjectRoot "frontend"
    $FrontendCommand = "cd '$FrontendPath'; Write-Host ''; Write-Host '=======================================' -ForegroundColor Magenta; Write-Host '  DeFi Frontend (Next.js + Turbopack)' -ForegroundColor Magenta; Write-Host '=======================================' -ForegroundColor Magenta; Write-Host ''; npm run dev"
    
    $FrontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCommand -PassThru
    $FrontendPid = $FrontendProcess.Id
    
    Write-Success "Frontend started (PID: $FrontendPid)"
} else {
    Write-Step "4/4" "Skipping frontend (SkipFrontend flag set)"
    $FrontendPid = $null
}

# Save process info for stop script
$ProcessInfo = @{
    NodePid = $NodePid
    FrontendPid = $FrontendPid
    StartTime = (Get-Date).ToString("o")
}

$ProcessInfo | ConvertTo-Json | Out-File -FilePath $ProcessInfoFile -Encoding UTF8

# ========================================
# Summary
# ========================================
Write-Header "Startup Complete!"

Write-Host "Services Running:" -ForegroundColor Green
Write-Host "-------------------------------------------------" -ForegroundColor Gray
Write-Host "   Hardhat Node:  " -NoNewline -ForegroundColor White
Write-Host "http://127.0.0.1:8545" -ForegroundColor Cyan
Write-Host "   Chain ID:      " -NoNewline -ForegroundColor White
Write-Host "31337" -ForegroundColor Cyan
if ($FrontendPid) {
    Write-Host "   Frontend:      " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:3000" -ForegroundColor Magenta
}
Write-Host "-------------------------------------------------" -ForegroundColor Gray

Write-Host ""
Write-Host "Quick Tips:" -ForegroundColor Yellow
Write-Host "   - Import test accounts into MetaMask using private keys from node terminal"
Write-Host "   - Use the Faucet tab to get test tokens"
Write-Host "   - Run .\scripts\stop-all.ps1 to stop all services"
Write-Host ""
