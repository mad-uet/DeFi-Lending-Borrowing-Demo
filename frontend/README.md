# DeFi Lending & Borrowing - Frontend

A modern, responsive web3 frontend for the DeFi Lending & Borrowing protocol built with Next.js 14, TypeScript, and Ethers.js v6.

## 🚀 Features

- **Wallet Integration**: MetaMask wallet connection with auto-reconnect
- **Supply & Earn**: Deposit assets to earn interest and LAR rewards
- **Borrow**: Borrow assets against your collateral
- **Health Factor Monitoring**: Real-time position health tracking
- **Token Faucet**: Get test tokens for development
- **Real-time Updates**: Auto-refresh data every 5 seconds
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Mode**: Full dark mode support
- **Transaction Tracking**: Toast notifications for all actions

## 📋 Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension
- Hardhat contracts deployed (see parent directory)

## 🛠️ Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   
   After deploying contracts with Hardhat, run from the root directory:
   ```bash
   npx ts-node scripts/copy-artifacts-to-frontend.ts
   ```
   
   This will create `.env.local` with your contract addresses.

   Or manually create `.env.local`:
   ```env
   NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x...
   NEXT_PUBLIC_LAR_TOKEN_ADDRESS=0x...
   NEXT_PUBLIC_INTEREST_RATE_MODEL_ADDRESS=0x...
   NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x...
   NEXT_PUBLIC_WETH_ADDRESS=0x...
   NEXT_PUBLIC_DAI_ADDRESS=0x...
   NEXT_PUBLIC_USDC_ADDRESS=0x...
   NEXT_PUBLIC_LINK_ADDRESS=0x...
   NEXT_PUBLIC_CHAIN_ID=31337
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### First Time Setup

1. **Connect Wallet**:
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Ensure you're on the correct network (Hardhat local: 31337)

2. **Get Test Tokens**:
   - Use the Token Faucet to mint test tokens
   - Click "Get 1000 WETH" (or any token)
   - Approve transaction in MetaMask
   - Repeat for other tokens as needed

### Supplying Assets

1. Navigate to the **Supply** tab
2. Click **Supply** on any asset
3. Enter the amount to supply
4. Click **Supply** button
5. Approve token spending (first time only)
6. Confirm deposit transaction
7. Your supply will appear in "Your Supplies"

### Borrowing Assets

1. Ensure you have supplied collateral first
2. Navigate to the **Borrow** tab
3. Click **Borrow** on desired asset
4. Enter amount (watch health factor warning)
5. Click **Borrow** button
6. Confirm transaction
7. Your borrow will appear in "Your Borrows"

### Withdrawing & Repaying

- **Withdraw**: Click "Withdraw" in "Your Supplies", enter amount, confirm
- **Repay**: Click "Repay" in "Your Borrows", enter amount, approve + confirm

### Health Factor

- **Green (≥ 1.5)**: Your position is safe
- **Yellow (1.0 - 1.5)**: Warning - consider adding collateral
- **Red (< 1.0)**: Danger - risk of liquidation

## 🏗️ Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Main dashboard
│   └── globals.css             # Global styles
├── components/
│   ├── WalletConnect.tsx       # Wallet connection
│   ├── SupplyAssets.tsx        # Supply assets table
│   ├── YourSupplies.tsx        # User deposits table
│   ├── BorrowAssets.tsx        # Borrow assets table
│   ├── YourBorrows.tsx         # User loans table
│   ├── HealthFactor.tsx        # Health factor indicator
│   ├── Faucet.tsx              # Token faucet
│   └── modals/
│       ├── ModalSupply.tsx     # Supply modal
│       ├── ModalWithdraw.tsx   # Withdraw modal
│       ├── ModalBorrow.tsx     # Borrow modal
│       └── ModalRepay.tsx      # Repay modal
├── hooks/
│   ├── useWeb3.ts              # Web3 context & wallet
│   ├── useContract.ts          # Contract instances
│   ├── useSupplyAssets.ts      # Supply data fetching
│   ├── useUserSupplies.ts      # User deposits data
│   ├── useBorrowAssets.ts      # Borrow data fetching
│   └── useUserBorrows.ts       # User loans data
├── lib/
│   ├── contracts.ts            # ABIs & addresses
│   └── utils.ts                # Helper functions
└── types/
    └── index.ts                # TypeScript types
```

## 🔧 Configuration

### Supported Tokens

- **WETH** (Wrapped Ether): 75% LTV, 80% liquidation threshold
- **DAI** (Dai Stablecoin): 80% LTV, 85% liquidation threshold
- **USDC** (USD Coin): 80% LTV, 85% liquidation threshold
- **LINK** (Chainlink): 70% LTV, 75% liquidation threshold

### Network Configuration

Default: Hardhat Local Network (chainId: 31337)

To use other networks, update `.env.local`:
- Sepolia Testnet: chainId 11155111
- Ethereum Mainnet: chainId 1

## 🧪 Development

### Running Tests

Frontend uses manual testing. For contract tests:
```bash
cd ..
npm test
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 🎨 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Web3**: Ethers.js v6
- **Styling**: Tailwind CSS
- **Data Fetching**: SWR
- **Notifications**: React Hot Toast
- **UI Components**: Radix UI

## 📊 Features in Detail

### Real-Time Data

All data refreshes automatically every 5 seconds:
- Asset prices and APYs
- User balances and positions
- Health factor
- LAR rewards

### Transaction Flow

1. User initiates action (supply/borrow/withdraw/repay)
2. Modal opens with input form
3. Amount validation
4. Approval step (for ERC20 tokens, if needed)
5. Transaction execution
6. Loading state with spinner
7. Success/error notification
8. Data refresh
9. Modal closes

### Error Handling

- User-friendly error messages
- Toast notifications for all errors
- Graceful fallbacks for missing data
- Contract error parsing

## 🔐 Security Notes

- Never share your private keys
- This is a development/demo application
- Use test networks only
- Audit contracts before mainnet deployment

## 🐛 Troubleshooting

### "Please install MetaMask"
Install the MetaMask browser extension from [metamask.io](https://metamask.io)

### "Failed to connect wallet"
- Ensure MetaMask is unlocked
- Check you're on the correct network
- Try refreshing the page

### "Transaction failed"
- Check you have enough tokens
- Ensure sufficient gas
- Verify health factor won't go below 1.0
- Check contract addresses are correct

### "No data showing"
- Verify contracts are deployed
- Check `.env.local` has correct addresses
- Ensure you're on the correct network
- Try disconnecting and reconnecting wallet

## 📝 License

MIT

## 🤝 Contributing

This is a demonstration project. For production use, please:
1. Audit all smart contracts
2. Add comprehensive tests
3. Implement proper error boundaries
4. Add E2E testing
5. Optimize gas usage

## 📞 Support

For issues and questions:
1. Check troubleshooting section above
2. Review contract deployment logs
3. Verify network configuration
4. Check browser console for errors

---

Built with ❤️ using Next.js and Ethers.js
