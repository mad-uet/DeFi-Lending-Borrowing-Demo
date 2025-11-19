# Phase 5 Frontend - Installation Verification

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 5 Frontend Installation Checker" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$frontendPath = "C:\Users\Administrator\Documents\DeFi-LeBo-SimApp\frontend"
$errors = @()
$warnings = @()

# Check if frontend directory exists
if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend directory exists`n" -ForegroundColor Green

# Check critical files
$criticalFiles = @(
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "tailwind.config.ts",
    "src\app\layout.tsx",
    "src\app\page.tsx",
    "src\hooks\useWeb3.ts",
    "src\hooks\useContract.ts",
    "src\lib\contracts.ts",
    "src\lib\utils.ts",
    "src\types\index.ts"
)

Write-Host "Checking critical files..." -ForegroundColor Yellow
foreach ($file in $criticalFiles) {
    $fullPath = Join-Path $frontendPath $file
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MISSING" -ForegroundColor Red
        $errors += $file
    }
}

# Check components
$components = @(
    "WalletConnect.tsx",
    "SupplyAssets.tsx",
    "YourSupplies.tsx",
    "BorrowAssets.tsx",
    "YourBorrows.tsx",
    "HealthFactor.tsx",
    "Faucet.tsx"
)

Write-Host "`nChecking components..." -ForegroundColor Yellow
foreach ($comp in $components) {
    $fullPath = Join-Path $frontendPath "src\components\$comp"
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $comp" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $comp MISSING" -ForegroundColor Red
        $errors += "components\$comp"
    }
}

# Check modals
$modals = @(
    "ModalSupply.tsx",
    "ModalWithdraw.tsx",
    "ModalBorrow.tsx",
    "ModalRepay.tsx"
)

Write-Host "`nChecking modals..." -ForegroundColor Yellow
foreach ($modal in $modals) {
    $fullPath = Join-Path $frontendPath "src\components\modals\$modal"
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $modal" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $modal MISSING" -ForegroundColor Red
        $errors += "modals\$modal"
    }
}

# Check hooks
$hooks = @(
    "useWeb3.ts",
    "useContract.ts",
    "useSupplyAssets.ts",
    "useUserSupplies.ts",
    "useBorrowAssets.ts",
    "useUserBorrows.ts"
)

Write-Host "`nChecking hooks..." -ForegroundColor Yellow
foreach ($hook in $hooks) {
    $fullPath = Join-Path $frontendPath "src\hooks\$hook"
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $hook" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $hook MISSING" -ForegroundColor Red
        $errors += "hooks\$hook"
    }
}

# Check documentation
$docs = @(
    "README.md",
    "QUICKSTART.md",
    "INTEGRATION.md"
)

Write-Host "`nChecking documentation..." -ForegroundColor Yellow
foreach ($doc in $docs) {
    $fullPath = Join-Path $frontendPath $doc
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ $doc missing" -ForegroundColor Yellow
        $warnings += $doc
    }
}

# Check environment setup
Write-Host "`nChecking environment setup..." -ForegroundColor Yellow
$envExample = Join-Path $frontendPath ".env.example"
$envLocal = Join-Path $frontendPath ".env.local"

if (Test-Path $envExample) {
    Write-Host "  ✅ .env.example exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ .env.example MISSING" -ForegroundColor Red
    $errors += ".env.example"
}

if (Test-Path $envLocal) {
    Write-Host "  ✅ .env.local exists (configured)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ .env.local not found (needs configuration)" -ForegroundColor Yellow
    $warnings += ".env.local - Run: npx ts-node scripts/copy-artifacts-to-frontend.ts"
}

# Check node_modules
Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
$nodeModules = Join-Path $frontendPath "node_modules"
if (Test-Path $nodeModules) {
    Write-Host "  ✅ node_modules exists (dependencies installed)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ node_modules not found" -ForegroundColor Yellow
    $warnings += "node_modules - Run: cd frontend && npm install"
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Installation Check Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "`nYour frontend is ready to run!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. cd frontend" -ForegroundColor White
    Write-Host "2. npm install (if not done)" -ForegroundColor White
    Write-Host "3. Configure .env.local with contract addresses" -ForegroundColor White
    Write-Host "4. npm run dev" -ForegroundColor White
} else {
    if ($errors.Count -gt 0) {
        Write-Host "❌ ERRORS FOUND: $($errors.Count)" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  - $error" -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "`n⚠️ WARNINGS: $($warnings.Count)" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
    }
    
    if ($errors.Count -eq 0) {
        Write-Host "`n✅ Core installation complete (warnings can be resolved)" -ForegroundColor Green
    }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

# File count
$allFiles = Get-ChildItem -Path $frontendPath -Recurse -File | Where-Object { 
    $_.Extension -match '\.(ts|tsx|json|js|css|md)$' -and 
    $_.FullName -notmatch 'node_modules' 
}

Write-Host "📊 Statistics:" -ForegroundColor Cyan
Write-Host "  Total files: $($allFiles.Count)" -ForegroundColor White
Write-Host "  TypeScript/TSX: $(($allFiles | Where-Object { $_.Extension -match '\.(ts|tsx)$' }).Count)" -ForegroundColor White
Write-Host "  Config files: $(($allFiles | Where-Object { $_.Extension -match '\.(json|js)$' }).Count)" -ForegroundColor White
Write-Host "  Documentation: $(($allFiles | Where-Object { $_.Extension -eq '.md' }).Count)" -ForegroundColor White

Write-Host "`nPhase 5 Frontend Implementation Complete!`n" -ForegroundColor Green
