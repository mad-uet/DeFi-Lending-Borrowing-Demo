# Deployment Guide

This guide explains how to deploy the DeFi Lending & Borrowing Platform to different networks.

## Table of Contents

1. [Local Deployment (Hardhat)](#local-deployment-hardhat)
2. [Testnet Deployment](#testnet-deployment)
3. [Mainnet Deployment](#mainnet-deployment)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

## Local Deployment (Hardhat)

### Prerequisites

- Node.js 18+ installed
- Git repository cloned
- Dependencies installed (`npm install`)

### Quick Start (Recommended)

The fastest way to get everything running:

```powershell
npm start
```

This single command will:
1. Start a local Hardhat node in a new terminal
2. Deploy all contracts automatically  
3. Copy artifacts to frontend
4. Start Next.js frontend with Turbopack (10x faster builds)

**To stop all services:**

```powershell
npm run stop
```

### Manual Deployment (Alternative)

If you prefer manual control over each step:

#### Step 1: Start Hardhat Node

```bash
npm run node
```

This starts a local blockchain at `http://127.0.0.1:8545` with:
- 20 pre-funded test accounts
- Chain ID: 31337
- Block time: Instant (auto-mining)

**Keep this terminal open** - it must stay running for local development.

### Step 2: Deploy Contracts

In a **new terminal**:

```bash
npm run deploy:all
```

**Expected Output**:

```
Deploying Mock Tokens...
✅ WETH deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ DAI deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✅ USDC deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
✅ LINK deployed at: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

Deploying Mock Price Feeds...
✅ WETH/USD feed: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
✅ DAI/USD feed: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
✅ USDC/USD feed: 0x0165878A594ca255338adfa4d48449f69242Eb8F
✅ LINK/USD feed: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853

Deploying Core Contracts...
✅ LAR Token deployed at: 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
✅ Interest Rate Model deployed at: 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
✅ Price Oracle deployed at: 0x610178dA211FEF7D417bC0e6FeD39F05609AD788
✅ Lending Pool deployed at: 0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e

Configuring tokens...
✅ Added WETH with 75% LTV
✅ Added DAI with 80% LTV
✅ Added USDC with 80% LTV
✅ Added LINK with 60% LTV

Deployment Summary:
=====================
WETH: 0x5FbDB2315678afecb367f032d93F642f64180aa3
DAI: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
USDC: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
LINK: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
Lending Pool: 0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
LAR Token: 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
Interest Rate Model: 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
Price Oracle: 0x610178dA211FEF7D417bC0e6FeD39F05609AD788

✅ Deployment complete!
```

**Save these addresses** - you'll need them for frontend configuration.

### Step 3: Copy Artifacts to Frontend

```bash
npx ts-node scripts/copy-artifacts-to-frontend.ts
```

This copies contract ABIs from `artifacts/contracts/` to `frontend/src/contracts/`.

### Step 4: Configure Frontend

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Create `.env.local` file:

```bash
# Copy addresses from deployment output
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
NEXT_PUBLIC_LAR_TOKEN_ADDRESS=0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
NEXT_PUBLIC_INTEREST_RATE_MODEL_ADDRESS=0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x610178dA211FEF7D417bC0e6FeD39F05609AD788

NEXT_PUBLIC_WETH_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_DAI_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_USDC_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_LINK_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

NEXT_PUBLIC_CHAIN_ID=31337
```

3. Install frontend dependencies:

```bash
npm install
```

4. Start development server:

```bash
npm run dev
```

5. Open browser: `http://localhost:3000`

### Step 5: Configure MetaMask

1. Open MetaMask browser extension
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter network details:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: ETH
4. Click "Save"
5. Switch to "Hardhat Local" network

### Step 6: Import Test Accounts

1. Go back to Hardhat node terminal
2. Copy a private key (e.g., Account #0)
3. In MetaMask: Click account icon → "Import Account"
4. Paste private key
5. Click "Import"
6. Repeat for 2-3 additional accounts for testing

**✅ Local deployment complete!** You can now use the application.

---

## Testnet Deployment

### Supported Testnets

- **Sepolia** (Recommended - most actively maintained)
- **Goerli** (Being deprecated)
- **Mumbai** (Polygon testnet)

### Prerequisites

1. **Get Testnet ETH**:
   - Sepolia: [Alchemy Faucet](https://sepoliafaucet.com/)
   - Goerli: [Goerli Faucet](https://goerlifaucet.com/)
   - Mumbai: [Polygon Faucet](https://faucet.polygon.technology/)

2. **Get Alchemy/Infura API Key**:
   - Sign up at [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
   - Create a new app for your chosen testnet
   - Copy the API key

3. **Prepare Deployer Account**:
   - Create a new wallet (for security, don't use your main wallet)
   - Export private key
   - Fund with testnet ETH (0.5+ ETH recommended)

### Step 1: Configure Environment

Create `.env` file in project root:

```bash
# Network RPC
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
GOERLI_RPC_URL=https://eth-goerli.g.alchemy.com/v2/YOUR_API_KEY
MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY

# Deployer private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Etherscan API key (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

**⚠️ SECURITY**: Never commit `.env` to git! It's already in `.gitignore`.

### Step 2: Update Hardhat Config

Ensure `hardhat.config.ts` has testnet configurations:

```typescript
const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5,
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
};
```

### Step 3: Use Real Chainlink Price Feeds

For testnet deployment, you **must use real Chainlink price feeds** instead of mocks.

Update `scripts/deploy-lending-pool.ts`:

```typescript
// Sepolia Chainlink Price Feeds
const SEPOLIA_PRICE_FEEDS = {
  WETH: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // ETH/USD
  DAI: "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19",  // DAI/USD
  USDC: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E", // USDC/USD
  LINK: "0xc59E3633BAAC79493d908e63626716e204A45EdF", // LINK/USD
};

// Deploy with real feeds
await priceOracle.setPriceFeed(weth.address, SEPOLIA_PRICE_FEEDS.WETH);
```

Find Chainlink feeds: [Chainlink Data Feeds](https://docs.chain.link/data-feeds/price-feeds/addresses)

### Step 4: Deploy to Testnet

```bash
npx hardhat run scripts/deploy-lending-pool.ts --network sepolia
```

**Note**: Testnet deployment is slower (12-15 second block times on Sepolia).

Expected time: **5-10 minutes**

### Step 5: Verify Contracts on Etherscan

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "constructor" "arguments"
```

Example:

```bash
npx hardhat verify --network sepolia 0x1234...5678 "0xTokenAddress" "0xModelAddress" "0xOracleAddress"
```

For all contracts, create a verification script:

```typescript
// scripts/verify.ts
const addresses = {
  lendingPool: "0x...",
  larToken: "0x...",
  // ... etc
};

await hre.run("verify:verify", {
  address: addresses.lendingPool,
  constructorArguments: [addresses.larToken, addresses.interestRateModel, addresses.priceOracle],
});
```

Run: `npx hardhat run scripts/verify.ts --network sepolia`

### Step 6: Update Frontend for Testnet

Update `frontend/.env.local`:

```bash
# Use deployed testnet addresses
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x...
NEXT_PUBLIC_LAR_TOKEN_ADDRESS=0x...
# ... etc

# Sepolia chain ID
NEXT_PUBLIC_CHAIN_ID=11155111
```

### Step 7: Get Testnet Tokens

For testing, you'll need testnet versions of tokens:

**Option 1**: Use existing testnet tokens (check Etherscan)

**Option 2**: Deploy your own mock tokens with faucet function

**Option 3**: Use testnet token faucets:
- [Sepolia DAI](https://sepolia-faucet.com/)
- [Chainlink Faucet](https://faucets.chain.link/) (for LINK)

**✅ Testnet deployment complete!**

---

## Mainnet Deployment

**⚠️ WARNING**: This protocol is **EDUCATIONAL** and **NOT AUDITED**.

### DO NOT deploy to mainnet with real funds unless:

- ✅ Full professional security audit completed
- ✅ Bug bounty program running for 3+ months
- ✅ Formal verification performed
- ✅ Testnet deployment tested for weeks
- ✅ Liquidation mechanism implemented
- ✅ Emergency pause function added
- ✅ Governance system in place
- ✅ Insurance fund established
- ✅ Legal review completed
- ✅ Multi-sig wallet for admin functions

### If You Proceed (At Your Own Risk)

1. Follow testnet deployment steps
2. Use `--network mainnet` instead of `--network sepolia`
3. Use mainnet Chainlink price feeds
4. Start with small amounts to test
5. Monitor 24/7 for issues
6. Have emergency response plan

**We strongly discourage mainnet deployment of this educational code.**

---

## Post-Deployment Configuration

### 1. Set Up Monitoring

Track contract events:

```typescript
lendingPool.on("Deposit", (user, token, amount, larMinted) => {
  console.log(`Deposit: ${user} supplied ${amount} ${token}`);
});

lendingPool.on("Borrow", (user, token, amount) => {
  console.log(`Borrow: ${user} borrowed ${amount} ${token}`);
});
```

### 2. Configure Token Parameters

Add or update supported tokens:

```typescript
// Add new token
await lendingPool.addToken(
  tokenAddress,
  7500 // 75% LTV
);

// Set price feed
await priceOracle.setPriceFeed(
  tokenAddress,
  chainlinkFeedAddress
);
```

### 3. Transfer Ownership (Production)

For production, transfer ownership to multi-sig wallet:

```typescript
// Deploy Gnosis Safe multi-sig
const gnosisSafe = "0x...";

// Transfer ownership
await lendingPool.transferOwnership(gnosisSafe);
await larToken.transferOwnership(gnosisSafe);
await priceOracle.transferOwnership(gnosisSafe);
```

### 4. Set Up Subgraph (Optional)

For better data querying, deploy a subgraph:

1. Create subgraph schema
2. Define event handlers
3. Deploy to The Graph
4. Query historical data efficiently

---

## Verification

### Smart Contract Checklist

- [ ] All contracts deployed successfully
- [ ] All contracts verified on block explorer
- [ ] Token configurations correct (LTV ratios)
- [ ] Price feeds set for all tokens
- [ ] Ownership transferred (if production)
- [ ] Events emitting correctly
- [ ] Test deposit transaction successful
- [ ] Test borrow transaction successful
- [ ] Interest rates calculating correctly

### Frontend Checklist

- [ ] `.env.local` configured with correct addresses
- [ ] Contract artifacts copied
- [ ] Wallet connects successfully
- [ ] All pages load without errors
- [ ] Faucet works (testnet only)
- [ ] Supply flow works end-to-end
- [ ] Borrow flow works end-to-end
- [ ] Health factor displays correctly
- [ ] Analytics page shows data
- [ ] Real-time updates working (SWR)

### Test Transactions

Run these test transactions to verify:

1. **Connect wallet** ✅
2. **Get tokens from faucet** (testnet) ✅
3. **Supply 1 WETH** ✅
4. **Verify LAR tokens received** ✅
5. **Borrow 500 DAI** ✅
6. **Check health factor** ✅
7. **Repay 500 DAI** ✅
8. **Withdraw 1 WETH** ✅
9. **Check analytics page** ✅

If all pass, deployment is successful!

---

## Troubleshooting

### Common Deployment Issues

**"Insufficient funds for gas"**:
- Ensure deployer account has enough ETH
- Mainnet: 0.5+ ETH recommended
- Testnet: 0.1+ ETH should suffice

**"Nonce too high"**:
- Reset account in MetaMask
- Or specify nonce manually in deployment script

**"Contract already deployed"**:
- Clean artifacts: `npx hardhat clean`
- Deploy to fresh network or use different addresses

**"Price feed not found"**:
- Verify Chainlink feed address is correct for your network
- Check [Chainlink docs](https://docs.chain.link/data-feeds/price-feeds/addresses)

**"Transaction reverted without reason"**:
- Check contract constructor arguments
- Verify dependencies deployed first
- Enable Hardhat console logs for debugging

### Frontend Issues

**"Contract not found"**:
- Verify contract addresses in `.env.local`
- Ensure artifacts copied (`npx ts-node scripts/copy-artifacts-to-frontend.ts`)

**"Wrong network"**:
- Check `NEXT_PUBLIC_CHAIN_ID` matches network
- Switch MetaMask to correct network

**"Wallet won't connect"**:
- Clear browser cache
- Reset MetaMask account
- Try different browser

### Getting Help

1. Check [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
2. Review Hardhat logs for error details
3. Search GitHub issues
4. Ask in community forums

---

## Deployment Checklist Summary

**Local**:
- [ ] Start Hardhat node
- [ ] Deploy contracts
- [ ] Copy artifacts
- [ ] Configure frontend
- [ ] Import test accounts
- [ ] Test all flows

**Testnet**:
- [ ] Get testnet ETH
- [ ] Configure `.env`
- [ ] Update price feeds
- [ ] Deploy contracts
- [ ] Verify on Etherscan
- [ ] Update frontend config
- [ ] Test thoroughly

**Mainnet** (⚠️ Not Recommended):
- [ ] Complete security audit
- [ ] Run bug bounty
- [ ] Legal review
- [ ] Deploy with caution
- [ ] Monitor 24/7
- [ ] Have emergency plan

---

**Deployment complete!** 🚀

For ongoing maintenance and updates, see [CONTRIBUTING.md](./CONTRIBUTING.md).
