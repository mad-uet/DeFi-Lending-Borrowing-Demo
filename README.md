# DeFi Lending & Borrowing Platform

An educational DeFi protocol demonstrating pool-based lending, over-collateralized borrowing, dynamic interest rates, and liquidation mechanisms with multi-collateral support.

## 🚀 Features

- **Pool-Based Liquidity**: Users supply assets to shared liquidity pools and earn interest
- **Over-Collateralized Borrowing**: Borrow assets against deposited collateral with configurable LTV ratios (WETH: 75%, DAI: 80%, USDC: 80%, LINK: 60%)
- **Dynamic Interest Rates**: Aave-like dual-slope interest rate model that responds to pool utilization
- **Chainlink Price Oracles**: Real-time price feeds for accurate collateral valuation
- **LAR Reward Tokens**: Lenders receive LAR tokens (1:1 with USD value of deposits)
- **Health Factor Monitoring**: Real-time health factor calculations prevent liquidations
- **Analytics Dashboard**: Protocol-wide statistics and token market data
- **Full-Featured Frontend**: Modern Next.js interface with responsive design and dark mode

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn**
- **MetaMask** browser extension

## 🛠️ Installation

### 1. Clone and Install

```bash
git clone <repository-url>
cd DeFi-LeBo-SimApp
npm install
cd frontend && npm install && cd ..
```

### 2. Compile Contracts

```bash
npm run compile
```

### 3. Run Tests (Optional)

```bash
npm test
```

Expected: **233+ tests passing**

## 🚀 Quick Start

### One-Command Startup (Recommended)

The easiest way to start everything:

```powershell
npm start
# or
.\scripts\start-all.ps1
```

This single command will:
1. ✅ Start Hardhat node in a new terminal
2. ✅ Deploy all contracts automatically
3. ✅ Copy artifacts to frontend
4. ✅ Start Next.js frontend with Turbopack (10x faster)

**To stop all services:**

```powershell
npm run stop
# or
.\scripts\stop-all.ps1
```

### Manual Setup (Alternative)

If you prefer manual control:

#### Start Local Blockchain

In one terminal, start a Hardhat node:

```bash
npm run node
```

This will:

- Start a local blockchain on `http://127.0.0.1:8545`
- Display 20 test accounts with private keys
- Keep running in the foreground

### Deploy Contracts

In a **new terminal**, deploy the contracts:

```bash
npm run deploy:all
```

This will deploy all contracts and output their addresses.

### Copy Contract Artifacts

```bash
npm run copy:artifacts
```

### Start Frontend

```bash
npm run frontend:dev
```

The application will be available at `http://localhost:3000`

### Configure MetaMask

1. Open MetaMask → Add Network → Add a network manually
2. Enter:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: ETH
3. Import test account private keys from Hardhat node output

## 📖 Usage Guide

### 1. Connect Wallet & Get Test Tokens

- Open `http://localhost:3000`
- Click "Connect Wallet"
- Use Faucet tab to get test tokens (10 WETH, 10,000 DAI, 10,000 USDC, 100 LINK)

### 2. Supply Assets (Earn Interest)

- Go to "Supply" tab
- Select a token and enter amount
- Approve token spending (first time only)
- Confirm supply transaction
- **Receive LAR tokens** (1:1 with USD value)

### 3. Borrow Assets

- Ensure you have sufficient collateral supplied
- Go to "Borrow" tab
- Select a token and enter amount
- Monitor your health factor
- Confirm borrow transaction

### 4. Monitor Health Factor

- **Health Factor** = (Collateral Value × Liquidation Threshold) / Total Debt
- **Safe**: > 1.5 (green)
- **Warning**: 1.0 - 1.5 (yellow)
- **Danger**: < 1.0 (red, risk of liquidation)

### 5. Repay & Withdraw

- **Repay**: Select borrowed token, enter amount, confirm
- **Withdraw**: Select supplied token, enter amount (limited by health factor), confirm

## 🏗️ Architecture

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)

### Core Contracts

1. **LendingPool**: Main contract for deposits, withdrawals, borrows, and repayments
2. **LARToken**: ERC20 reward token minted for lenders
3. **InterestRateModel**: Dual-slope interest rate calculation
4. **PriceOracle**: Chainlink-based price feeds

### Interest Rate Model

```
If Utilization < 80% (Optimal):
  Rate = BaseRate + (Utilization × Slope1)

If Utilization >= 80%:
  Rate = BaseRate + (OptimalUtil × Slope1) + ((Utilization - OptimalUtil) × Slope2)
```

Example rates:

- 0% utilization: 2% APY
- 50% utilization: 6% APY
- 80% utilization: 10% APY
- 95% utilization: 40% APY

## 🧪 Testing

### Run All Tests

```bash
npx hardhat test
```

### Run Specific Test Suite

```bash
npx hardhat test test/LendingPool.deposit.test.ts
```

### Generate Coverage Report

```bash
npx hardhat coverage
```

### Test Categories

- **Unit Tests**: Individual contract functionality
- **Integration Tests**: Multi-contract interactions
- **Scenario Tests**: Real-world use cases (multi-user, interest accrual)

Expected: **233+ tests passing** with **100% coverage**

## 📊 Protocol Analytics

Access the analytics dashboard at `http://localhost:3000/analytics` to view:

- Total Value Locked (TVL)
- Total Borrowed across all tokens
- Overall utilization rate
- Per-token statistics (supply APY, borrow APY, utilization)
- LAR tokens in circulation

## 🎮 Demo Scenarios

For detailed demo walkthroughs, see [docs/demo-scenarios.md](./docs/demo-scenarios.md)

### Quick Demo

1. **Account A**: Supply 5 WETH → Receive ~10,000 LAR tokens
2. **Account B**: Supply 10,000 DAI → Borrow 2 WETH
3. **Account C**: Supply mixed collateral → Borrow LINK
4. View analytics dashboard to see protocol statistics

## 📚 Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System design and components
- [Demo Scenarios](./docs/demo-scenarios.md) - Step-by-step walkthroughs
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Testing Guide](./docs/TESTING.md) - How to run and write tests
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Frontend Guide](./frontend/README.md) - Frontend setup and development
- [Contributing](./CONTRIBUTING.md) - Guidelines for contributors

## 🎯 Project Status

- ✅ **Phase 1**: Project Setup & Mock Contracts (34 tests)
- ✅ **Phase 2**: LAR Token & Interest Rate Model (62 tests)
- ✅ **Phase 3**: Lending Pool Core Logic (169 tests)
- ✅ **Phase 4**: Price Oracle & Integration (225 tests)
- ✅ **Phase 5**: Full-Featured Frontend (Next.js)
- ✅ **Phase 6**: Analytics Dashboard & Documentation (233+ tests)

**Total Tests**: 233+ passing | **Coverage**: 100% | **Status**: Complete

## 🔐 Security Considerations

This is an **educational project** for learning DeFi concepts. It is **NOT audited** and should **NOT** be used in production with real funds.

Key security features implemented:

- ✅ Reentrancy protection (checks-effects-interactions pattern)
- ✅ Access control (Ownable)
- ✅ Input validation
- ✅ Integer overflow protection (Solidity 0.8+)
- ✅ Price staleness checks
- ✅ Health factor validation

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Code style
- Testing requirements
- Documentation standards
- Pull request process

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by [Aave Protocol](https://aave.com/)
- Uses [Chainlink](https://chain.link/) price feeds
- Built with [Hardhat](https://hardhat.org/)
- Frontend with [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For questions or issues:

1. Check [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
2. Review existing issues
3. Open a new issue with detailed description

---

**Built for educational purposes** | Learn DeFi concepts through hands-on development
