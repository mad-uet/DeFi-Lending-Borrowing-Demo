# Troubleshooting Guide

Common issues and solutions for the DeFi Lending & Borrowing Platform.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Compilation Errors](#compilation-errors)
3. [Deployment Problems](#deployment-problems)
4. [MetaMask Connection Issues](#metamask-connection-issues)
5. [Transaction Failures](#transaction-failures)
6. [Frontend Errors](#frontend-errors)
7. [Contract Interaction Issues](#contract-interaction-issues)
8. [Test Failures](#test-failures)
9. [Performance Issues](#performance-issues)
10. [Network Issues](#network-issues)

---

## Installation Issues

### Error: `npm install` fails with ERESOLVE

**Problem**: Dependency conflict during installation

**Solution**:

```bash
# Try with legacy peer deps
npm install --legacy-peer-deps

# Or use force
npm install --force

# Or clear cache first
npm cache clean --force
npm install
```

### Error: Node version incompatible

**Problem**: Using Node.js version < 18

**Solution**:

```bash
# Check Node version
node --version

# Install Node 18+ using nvm
nvm install 18
nvm use 18

# Or download from nodejs.org
```

### Error: Python not found (node-gyp)

**Problem**: Native modules need Python for compilation

**Solution**:

**Windows**:

```bash
npm install --global windows-build-tools
```

**macOS**:

```bash
xcode-select --install
```

**Linux**:

```bash
sudo apt-get install python3 build-essential
```

---

## Compilation Errors

### Error: `Solidity compiler not found`

**Problem**: Hardhat can't find or download Solidity compiler

**Solution**:

```bash
# Clear Hardhat cache
npx hardhat clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try compiling again
npx hardhat compile
```

### Error: `Stack too deep`

**Problem**: Too many local variables in a function

**Solution**:

```solidity
// Bad: Too many variables
function myFunction() {
    uint256 var1 = ...;
    uint256 var2 = ...;
    // ... many more variables
}

// Good: Group into struct or split function
struct Calculations {
    uint256 value1;
    uint256 value2;
}

function myFunction() {
    Calculations memory calc;
    calc.value1 = ...;
}
```

### Error: `Contract code size exceeds 24576 bytes`

**Problem**: Contract too large

**Solution**:

```typescript
// In hardhat.config.ts
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,  // Increase for deployment optimization
      },
    },
  },
};
```

Or split contract into multiple smaller contracts.

---

## Deployment Problems

### Error: `Insufficient funds for gas`

**Problem**: Deployer account doesn't have enough ETH

**Solution**:

**Local Network**:

```bash
# Use account from hardhat node (pre-funded)
# Accounts shown when you run: npx hardhat node
```

**Testnet**:

```bash
# Get testnet ETH from faucets
# Sepolia: https://sepoliafaucet.com/
# Goerli: https://goerlifaucet.com/
```

### Error: `Transaction was not mined within 750 seconds`

**Problem**: Network congestion or gas price too low

**Solution**:

```typescript
// Increase timeout in hardhat.config.ts
const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 120000,  // 120 seconds
    },
  },
};
```

Or increase gas price:

```typescript
await contract.deploy({
  gasPrice: ethers.parseUnits("50", "gwei"),
});
```

### Error: `Contract address collision`

**Problem**: Trying to deploy to same address

**Solution**:

```bash
# Start fresh Hardhat node
# Kill existing: Ctrl+C
npx hardhat node

# Deploy again
npx hardhat run scripts/deploy-lending-pool.ts --network localhost
```

### Error: `Nonce too high`

**Problem**: Nonce out of sync

**Solution**:

**MetaMask**:

1. Settings → Advanced → Reset Account
2. Confirm reset
3. Try transaction again

**Hardhat**:

```bash
# Clear cache
npx hardhat clean

# Restart node
npx hardhat node
```

---

## MetaMask Connection Issues

### Error: `MetaMask not detected`

**Problem**: MetaMask not installed or not recognized

**Solution**:

1. Install MetaMask: [metamask.io](https://metamask.io/)
2. Reload page after installation
3. If still not detected, check browser extensions are enabled
4. Try different browser (Chrome, Firefox, Brave)

### Error: `Wrong network`

**Problem**: MetaMask connected to wrong network

**Solution**:

1. Open MetaMask
2. Click network dropdown
3. Select "Hardhat Local" (or add it if missing)
4. If missing, add network manually:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

### Error: `User rejected the request`

**Problem**: User clicked "Reject" in MetaMask

**Solution**:

- Click "Approve" or "Confirm" in MetaMask when prompted
- If you clicked reject by accident, try the transaction again

### Error: `Already processing eth_requestAccounts`

**Problem**: Multiple connection requests at once

**Solution**:

1. Refresh page
2. Connect wallet once
3. Wait for connection to complete before making transactions

### Error: `Accounts changed but not reflected in app`

**Problem**: App not listening to account changes

**Solution**:

```typescript
// Add to useWeb3 hook
useEffect(() => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        disconnect();
      }
    });
  }
}, []);
```

---

## Transaction Failures

### Error: `Transaction reverted: Amount must be greater than 0`

**Problem**: Trying to supply/borrow/repay 0 amount

**Solution**:

- Enter a positive amount in the input field
- Check input validation in frontend

### Error: `Transaction reverted: Insufficient balance`

**Problem**: Trying to withdraw more than deposited

**Solution**:

- Check "Your Supplies" to see available balance
- Withdraw less than or equal to deposited amount
- Use "Max" button to withdraw all available

### Error: `Transaction reverted: Insufficient collateral`

**Problem**: Trying to borrow more than borrowing power allows

**Solution**:

- Check "Borrow Limit" in dashboard
- Supply more collateral first
- Borrow a smaller amount
- Formula: `Max Borrow = Collateral Value × LTV`

### Error: `Transaction reverted: Health factor too low`

**Problem**: Action would make health factor < 1.0

**Solution**:

- Repay some debt to improve health factor
- Supply more collateral
- Withdraw less (keep health factor > 1.0)
- Check health factor widget before transaction

### Error: `Transaction reverted: Token not supported`

**Problem**: Using unsupported token address

**Solution**:

- Use only supported tokens: WETH, DAI, USDC, LINK
- Check token addresses in `.env.local` are correct
- Verify token was added to LendingPool

### Error: `Transaction reverted: Token not active`

**Problem**: Token has been deactivated

**Solution**:

- Use a different token
- Contact admin to reactivate token (owner only)

### Error: `ERC20: insufficient allowance`

**Problem**: Haven't approved token spending

**Solution**:

1. Click "Approve" button in modal
2. Confirm approval transaction in MetaMask
3. Wait for confirmation
4. Try supply/repay transaction again

### Error: `Gas estimation failed`

**Problem**: Transaction will revert, or gas limit too low

**Solution**:

1. Check transaction will succeed (e.g., sufficient balance)
2. Manually set gas limit:
   ```typescript
   await contract.deposit(token, amount, {
     gasLimit: 500000,
   });
   ```

---

## Frontend Errors

### Error: `Contract not found at address 0x...`

**Problem**: Wrong contract address or network mismatch

**Solution**:

1. Verify contract addresses in `frontend/.env.local`
2. Ensure they match deployed addresses
3. Check correct network (localhost vs. testnet)
4. Redeploy if addresses changed

### Error: `Cannot read properties of undefined (reading 'address')`

**Problem**: Wallet not connected when trying to access address

**Solution**:

```typescript
// Add null checks
const { address, isConnected } = useWeb3();

if (!isConnected || !address) {
  return <div>Please connect wallet</div>;
}
```

### Error: `Module not found: Can't resolve '@/contracts/...'`

**Problem**: Contract artifacts not copied to frontend

**Solution**:

```bash
# Copy artifacts
npx ts-node scripts/copy-artifacts-to-frontend.ts

# Verify files exist
ls frontend/src/contracts/
```

### Error: `Hydration failed because the initial UI does not match`

**Problem**: Server-rendered HTML doesn't match client

**Solution**:

```typescript
// Use client-side only rendering
'use client';

import { useEffect, useState } from 'react';

export default function Component() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <div>...</div>;
}
```

### Error: `Failed to fetch` or `Network request failed`

**Problem**: Frontend can't connect to blockchain

**Solution**:

1. Verify Hardhat node is running: `npx hardhat node`
2. Check RPC URL in `.env.local`: `http://127.0.0.1:8545`
3. Ensure no firewall blocking localhost
4. Try restarting Hardhat node

### Error: `SWR: Invalid hook call`

**Problem**: Hooks called incorrectly

**Solution**:

```typescript
// Bad: Conditional hook
if (isConnected) {
  const data = useSWR(...);  // ❌ Can't call hook conditionally
}

// Good: Conditional key
const data = useSWR(
  isConnected ? ['key', address] : null,  // ✅ Null key when not connected
  fetcher
);
```

---

## Contract Interaction Issues

### Error: `Stale price`

**Problem**: Price oracle data too old

**Solution**:

**Local Development**:

```typescript
// Update mock price feed
await mockPriceFeed.updateAnswer(newPrice);
```

**Testnet/Mainnet**:

- Wait for Chainlink oracle to update (automatic)
- Check oracle hasn't been deprecated
- Verify correct feed address for network

### Error: `Invalid price`

**Problem**: Price feed returning 0 or negative

**Solution**:

- Ensure mock price feeds initialized with valid prices
- Check Chainlink feed is active on network
- Verify price feed address correct

### Error: `LAR tokens not minted`

**Problem**: LAR tokens not received after deposit

**Solution**:

1. Check transaction succeeded
2. Verify LAR token address in contract
3. Check LARToken contract has LendingPool as minter:
   ```solidity
   // LARToken owner should be LendingPool
   require(msg.sender == owner(), "Only owner can mint");
   ```

### Error: `Interest rate incorrect`

**Problem**: Unexpected APY calculation

**Solution**:

- Check utilization rate: `Utilization = Borrows / Deposits`
- Verify interest rate parameters:
  - Base Rate: 2%
  - Slope 1: 0.08
  - Slope 2: 1.5
  - Optimal: 80%
- Use formula from [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Test Failures

### Error: `Timeout of 40000ms exceeded`

**Problem**: Test taking too long

**Solution**:

```typescript
// Increase timeout for specific test
it("Should do something", async function () {
  this.timeout(60000);  // 60 seconds
  // Test code
});

// Or globally in hardhat.config.ts
const config: HardhatUserConfig = {
  mocha: {
    timeout: 60000,
  },
};
```

### Error: `VM Exception while processing transaction: revert`

**Problem**: Transaction reverting in test

**Solution**:

```typescript
// Add verbose logging
import { expect } from "chai";

// Check revert reason
await expect(
  contract.deposit(token, amount)
).to.be.revertedWith("Expected error message");

// Add console.log in Solidity (Hardhat only)
import "hardhat/console.sol";

console.log("Value:", someValue);
```

### Error: `AssertionError: Expected X to equal Y`

**Problem**: Assertion failed

**Solution**:

- Check expected values are correct
- Account for rounding errors with BigInt:
  ```typescript
  // Bad: Exact equality
  expect(actualValue).to.equal(expectedValue);

  // Good: Allow small tolerance
  expect(actualValue).to.be.closeTo(expectedValue, 1);
  ```

### Error: `Cannot find module 'typechain-types'`

**Problem**: TypeChain types not generated

**Solution**:

```bash
# Compile to generate types
npx hardhat compile

# Verify typechain-types/ folder exists
ls typechain-types/
```

---

## Performance Issues

### Problem: Frontend slow to load

**Solution**:

- Check SWR refresh intervals (reduce if too frequent)
- Use `useSWRConfig` to configure caching
- Lazy load heavy components:
  ```typescript
  const Analytics = dynamic(() => import('./Analytics'), {
    ssr: false,
  });
  ```

### Problem: Tests running slowly

**Solution**:

- Use fixtures with `loadFixture` to cache state
- Run tests in parallel (Hardhat default)
- Skip gas reporting in development:
  ```bash
  npx hardhat test  # Fast
  REPORT_GAS=true npx hardhat test  # Slower
  ```

### Problem: High gas costs

**Solution**:

- Enable optimizer in `hardhat.config.ts`
- Use `unchecked` for safe math
- Batch operations when possible
- See [TESTING.md](./TESTING.md) gas optimization section

---

## Network Issues

### Problem: Can't connect to localhost:8545

**Solution**:

1. Verify Hardhat node running: `npx hardhat node`
2. Check no other service on port 8545:
   ```bash
   # Windows
   netstat -ano | findstr :8545

   # macOS/Linux
   lsof -i :8545
   ```
3. Try different port in `hardhat.config.ts`:
   ```typescript
   networks: {
     hardhat: {
       chainId: 31337,
     },
     localhost: {
       url: "http://127.0.0.1:8546",  // Different port
     },
   }
   ```

### Problem: Testnet RPC not responding

**Solution**:

- Check Alchemy/Infura status page
- Verify API key is valid
- Try different RPC provider
- Check rate limits (free tier)

### Problem: Transaction pending forever

**Solution**:

1. Check block explorer (e.g., Etherscan) for transaction status
2. Increase gas price for faster confirmation
3. Cancel stuck transaction:
   - MetaMask: Settings → Advanced → Customize transaction nonce
   - Send 0 ETH to yourself with same nonce but higher gas

---

## Still Having Issues?

### Check Logs

**Hardhat Node Logs**:

- Terminal running `npx hardhat node`
- Shows all transactions and events

**Frontend Logs**:

- Browser DevTools → Console (F12)
- Check for errors or warnings

**Test Logs**:

```bash
# Verbose test output
npx hardhat test --verbose

# With stack traces
npx hardhat test --show-stack-traces
```

### Clean Slate

If all else fails, start fresh:

```bash
# Backend
npx hardhat clean
rm -rf node_modules package-lock.json
npm install
npx hardhat compile

# Frontend
cd frontend
rm -rf node_modules package-lock.json .next
npm install
cd ..

# Restart
npx hardhat node  # Terminal 1
npx hardhat run scripts/deploy-lending-pool.ts --network localhost  # Terminal 2
cd frontend && npm run dev  # Terminal 3
```

### Get Help

1. **Check Documentation**:
   - [README.md](../README.md)
   - [ARCHITECTURE.md](../ARCHITECTURE.md)
   - [DEPLOYMENT.md](../DEPLOYMENT.md)
   - [TESTING.md](./TESTING.md)

2. **Search Issues**: Check if someone else had the same problem

3. **Ask Community**: Discord, forums, Stack Overflow

4. **Open Issue**: If it's a bug, open a GitHub issue with:
   - Detailed description
   - Steps to reproduce
   - Error messages
   - Environment (OS, Node version, etc.)

---

**Most issues can be resolved by:**

1. ✅ Restarting Hardhat node
2. ✅ Clearing cache (`npx hardhat clean`)
3. ✅ Verifying contract addresses in `.env.local`
4. ✅ Checking MetaMask is on correct network
5. ✅ Ensuring wallet has sufficient balance

Good luck! 🚀
