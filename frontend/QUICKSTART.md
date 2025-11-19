# 🚀 Quick Start Guide - DeFi Lending Frontend

## Prerequisites
- Node.js 18+ installed
- MetaMask browser extension
- Hardhat contracts deployed locally

## Step-by-Step Setup

### 1. Deploy Contracts (if not done)

From the root directory:

```bash
# Start Hardhat node in a separate terminal
npx hardhat node

# In another terminal, deploy contracts
npx hardhat run scripts/deploy-lending-pool.ts --network localhost
```

Keep note of the deployed contract addresses.

### 2. Set Up Frontend Environment

Run the artifact copy script:

```bash
npx ts-node scripts/copy-artifacts-to-frontend.ts
```

This will:
- Create `deployments/localhost.json` with example addresses
- Generate `frontend/.env.local` with all contract addresses

**Important**: Update `deployments/localhost.json` with your actual deployed addresses!

Example `deployments/localhost.json`:
```json
{
  "LendingPool": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "LARToken": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  "InterestRateModel": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  "PriceOracle": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  "WETH": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  "DAI": "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  "USDC": "0x0165878A594ca255338adfa4d48449f69242Eb8F",
  "LINK": "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
}
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

### 5. Configure MetaMask

1. Open MetaMask
2. Add Hardhat Network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
3. Import test account from Hardhat node (check terminal for private keys)

### 6. Use the Application

#### First Time:
1. Click **"Connect Wallet"**
2. Approve MetaMask connection
3. Go to **Token Faucet** → Click **"Get 1000 WETH"**
4. Approve transaction in MetaMask
5. Repeat for other tokens (DAI, USDC, LINK)

#### Supply Assets:
1. Navigate to **Supply** tab
2. Click **"Supply"** next to WETH
3. Enter amount (e.g., 100)
4. Click **"Supply"** → Approve token → Confirm deposit
5. Your supply appears in "Your Supplies"

#### Borrow Assets:
1. Ensure you have collateral supplied
2. Navigate to **Borrow** tab
3. Click **"Borrow"** next to DAI
4. Enter amount (watch health factor!)
5. Click **"Borrow"** → Confirm
6. Your borrow appears in "Your Borrows"

#### Withdraw & Repay:
- **Withdraw**: Click "Withdraw" in "Your Supplies"
- **Repay**: Click "Repay" in "Your Borrows"

## Troubleshooting

### "Contract not deployed at address"
- Verify contract addresses in `frontend/.env.local`
- Ensure Hardhat node is running
- Re-deploy contracts if needed

### "User rejected transaction"
- Approve the transaction in MetaMask
- Check you have enough ETH for gas

### "Execution reverted"
- Check you have sufficient balance
- Ensure health factor won't drop below 1.0 when borrowing
- Verify you've approved tokens before depositing

### Data not loading
- Check browser console for errors
- Verify MetaMask is connected
- Ensure you're on the correct network (31337)
- Refresh the page

## Common Commands

```bash
# Frontend development
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Lint code

# Contract testing
cd ..
npm test             # Run all tests
npm run coverage     # Generate coverage report

# Deploy contracts
npx hardhat run scripts/deploy-lending-pool.ts --network localhost
```

## File Structure Overview

```
DeFi-LeBo-SimApp/
├── contracts/              # Solidity contracts
├── test/                   # Contract tests
├── scripts/                # Deployment scripts
├── deployments/            # Contract addresses
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── package.json
└── README.md
```

## Next Steps

1. ✅ Frontend is running
2. ✅ Wallet is connected
3. ✅ Tokens are minted
4. ✅ Supply some assets
5. ✅ Try borrowing
6. 📊 Monitor your health factor
7. 🎉 You're using DeFi!

## Support

- Check `frontend/README.md` for detailed documentation
- Review `PHASE5_SUMMARY.md` for technical details
- Check `PHASE5_CHECKLIST.md` for feature list

---

**Happy DeFi-ing!** 🚀
