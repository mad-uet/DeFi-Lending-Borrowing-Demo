# 🔗 Frontend-Contract Integration Guide

This guide explains how the Next.js frontend integrates with the Hardhat smart contracts.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  useWeb3   │→ │ useContract│→ │ Data Hooks │            │
│  │  (Wallet)  │  │ (Instances)│  │  (SWR)     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         ↓                ↓                ↓                  │
│  ┌─────────────────────────────────────────────┐           │
│  │            Ethers.js v6 Provider             │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      MetaMask                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   Hardhat Network                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Lending    │  │ LAR Token  │  │  ERC20s    │            │
│  │ Pool       │  │            │  │ (4 tokens) │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Contract Interaction Flow

### 1. Wallet Connection

**File**: `src/hooks/useWeb3.ts`

```typescript
// User clicks "Connect Wallet"
const connect = async () => {
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  // Store in context
};
```

**Flow**:
1. User clicks "Connect Wallet" button
2. Frontend requests MetaMask connection
3. User approves in MetaMask
4. Frontend receives account address and creates signer
5. Signer is stored in React Context for global access

### 2. Contract Instance Creation

**File**: `src/hooks/useContract.ts`

```typescript
// Create contract instance
const contract = new Contract(
  address,           // From .env.local
  abi,               // From contracts.ts
  signer || provider // Use signer for transactions, provider for reads
);
```

**ABIs Source**: Human-readable format in `src/lib/contracts.ts`

### 3. Reading Data (Supply Assets Example)

**File**: `src/hooks/useSupplyAssets.ts`

```typescript
// SWR fetcher function
const fetcher = async () => {
  // For each token (WETH, DAI, USDC, LINK)
  const walletBalance = await tokenContract.balanceOf(account);
  const totalSupplied = await lendingPool.getTokenBalance(tokenAddress);
  const supplyRate = await lendingPool.getSupplyRate(tokenAddress);
  
  return { walletBalance, totalSupplied, supplyRate };
};

// SWR hook with auto-refresh
useSWR(['supplyAssets', account], fetcher, {
  refreshInterval: 5000 // Refresh every 5 seconds
});
```

**Contract Methods Used**:
- `tokenContract.balanceOf(address)` → User's wallet balance
- `lendingPool.getTokenBalance(token)` → Total supplied to pool
- `lendingPool.getSupplyRate(token)` → Current supply APY

### 4. Writing Data (Supply Transaction Example)

**File**: `src/components/modals/ModalSupply.tsx`

```typescript
const handleSupply = async () => {
  // Step 1: Approve ERC20 spending
  const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
  const approveTx = await tokenContract.approve(
    LENDING_POOL_ADDRESS,
    amount
  );
  await approveTx.wait(); // Wait for confirmation
  
  // Step 2: Deposit to pool
  const lendingPool = new Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
  const depositTx = await lendingPool.deposit(tokenAddress, amount);
  await depositTx.wait(); // Wait for confirmation
  
  // Step 3: Refresh data
  mutate(); // SWR revalidates all queries
};
```

**Transaction Flow**:
1. User enters amount and clicks "Supply"
2. Frontend checks allowance
3. If needed, sends approve transaction
4. User confirms in MetaMask
5. Wait for approval confirmation
6. Send deposit transaction
7. User confirms in MetaMask
8. Wait for deposit confirmation
9. Show success toast
10. SWR automatically refreshes all data

## Contract Methods Mapping

### LendingPool Contract

| Frontend Hook | Contract Method | Purpose |
|---------------|-----------------|---------|
| `useSupplyAssets` | `getTokenBalance(token)` | Get total supplied |
| `useSupplyAssets` | `getSupplyRate(token)` | Get supply APY |
| `useUserSupplies` | `getUserDeposit(user, token)` | Get user's deposit |
| `useUserSupplies` | `getUserLARRewards(user)` | Get LAR earned |
| `useBorrowAssets` | `getBorrowRate(token)` | Get borrow APY |
| `useUserBorrows` | `getUserBorrow(user, token)` | Get user's borrow |
| `HealthFactor` | `calculateHealthFactor(user)` | Get health factor |
| `ModalSupply` | `deposit(token, amount)` | Deposit tokens |
| `ModalWithdraw` | `withdraw(token, amount)` | Withdraw tokens |
| `ModalBorrow` | `borrow(token, amount)` | Borrow tokens |
| `ModalRepay` | `repay(token, amount)` | Repay loan |

### ERC20 Token Contracts

| Frontend Component | Contract Method | Purpose |
|-------------------|-----------------|---------|
| All hooks | `balanceOf(account)` | Get wallet balance |
| All hooks | `decimals()` | Get token decimals |
| All hooks | `symbol()` | Get token symbol |
| Transaction modals | `approve(spender, amount)` | Approve spending |
| Transaction modals | `allowance(owner, spender)` | Check approval |
| Faucet | `mint(to, amount)` | Mint test tokens |

## Data Flow Examples

### Example 1: Displaying Supply Assets

```
User visits dashboard
    ↓
useSupplyAssets hook activates
    ↓
SWR checks cache (if exists, show immediately)
    ↓
Fetch data from contracts:
  - For WETH:
    • tokenContract.balanceOf(user) → "5.0 WETH"
    • lendingPool.getTokenBalance(WETH) → "1000 WETH"
    • lendingPool.getSupplyRate(WETH) → "250 bps" → "2.5%"
    ↓
Format data with utils:
  - formatTokenAmount("5000000000000000000", 18) → "5.0"
  - bpsToPercent(250) → "2.5"
    ↓
Render in SupplyAssets table
    ↓
SWR refreshes every 5 seconds (auto-update)
```

### Example 2: Supply Transaction

```
User clicks "Supply" on WETH
    ↓
ModalSupply opens with asset data
    ↓
User enters "2.5 WETH"
    ↓
User clicks "Supply" button
    ↓
Frontend checks approval:
  - tokenContract.allowance(user, lendingPool) → "0"
    ↓
Frontend requests approval:
  - tokenContract.approve(lendingPool, 2.5e18)
  - User confirms in MetaMask
  - Wait for tx confirmation
    ↓
Frontend deposits:
  - lendingPool.deposit(WETH, 2.5e18)
  - User confirms in MetaMask
  - Wait for tx confirmation
    ↓
Transaction succeeds
    ↓
SWR mutate() called → All data refreshes
    ↓
Updated balances shown:
  - Wallet: 2.5 WETH
  - Supplied: 2.5 WETH
  - LAR Earned: 0.125 LAR
    ↓
Modal closes, toast shows success
```

### Example 3: Health Factor Monitoring

```
User has:
  - Supplied: 5 WETH ($10,000)
  - Borrowed: 3,000 DAI ($3,000)
    ↓
useHealthFactor hook:
  - lendingPool.calculateHealthFactor(user) → 2.67e18
    ↓
Convert to readable:
  - Number(2.67e18) / 1e18 → 2.67
    ↓
Determine status:
  - 2.67 >= 1.5 → "safe"
  - Color: green
    ↓
Render HealthFactor component:
  - Big green circle (not pulsing)
  - "2.67" in large text
  - "Safe" label
    ↓
Auto-refresh every 5 seconds
    ↓
If user borrows more:
  - Health factor drops to 1.3
  - Status changes to "warning"
  - Circle turns yellow and pulses
  - Warning message appears
```

## Environment Configuration

### Contract Addresses

**File**: `frontend/.env.local`

```env
# Generated by scripts/copy-artifacts-to-frontend.ts
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x5FbDB2...
NEXT_PUBLIC_LAR_TOKEN_ADDRESS=0xe7f172...
NEXT_PUBLIC_WETH_ADDRESS=0xDc64a1...
# ... etc
```

**How it works**:
1. Deploy contracts with Hardhat
2. Note deployed addresses
3. Run `npx ts-node scripts/copy-artifacts-to-frontend.ts`
4. Script creates `deployments/localhost.json`
5. Script generates `.env.local` from deployment file
6. Frontend reads addresses from environment variables

### Token Configuration

**File**: `src/lib/contracts.ts`

```typescript
export const TOKEN_CONFIGS = {
  WETH: {
    symbol: 'WETH',
    decimals: 18,
    address: process.env.NEXT_PUBLIC_WETH_ADDRESS,
    collateralFactor: 0.75,  // 75% LTV
    liquidationThreshold: 0.80 // 80% liquidation
  },
  // ... other tokens
};
```

**Used for**:
- Displaying token information
- Calculating max borrow amounts
- Health factor calculations
- USD value conversions

## Error Handling

### Contract Reverts

```typescript
try {
  const tx = await contract.deposit(token, amount);
  await tx.wait();
} catch (error: any) {
  // Ethers.js error object
  if (error.code === 'ACTION_REJECTED') {
    toast.error('Transaction rejected by user');
  } else if (error.reason) {
    // Contract revert reason
    toast.error(error.reason);
  } else {
    toast.error('Transaction failed');
  }
}
```

**Common Contract Errors**:
- "Insufficient balance" → User doesn't have enough tokens
- "Health factor too low" → Borrow would cause liquidation
- "Amount must be greater than zero" → Invalid input
- "Token not supported" → Wrong token address

### Network Errors

```typescript
useEffect(() => {
  const handleChainChanged = () => {
    // Network changed - reload page to avoid issues
    window.location.reload();
  };
  
  window.ethereum?.on('chainChanged', handleChainChanged);
}, []);
```

## Performance Optimizations

### 1. SWR Caching
- Data cached between renders
- Deduplicated requests
- Background revalidation

### 2. Conditional Fetching
```typescript
useSWR(
  account && lendingPool ? ['key', account] : null,
  fetcher
);
// Only fetch when wallet connected
```

### 3. Batched Reads
```typescript
// Fetch all tokens in one loop instead of separate hooks
for (const token of SUPPORTED_TOKENS) {
  const balance = await token.balanceOf(account);
  // ... process
}
```

### 4. Memoization
```typescript
const contract = useMemo(
  () => new Contract(address, abi, signer),
  [address, signer]
);
// Only recreate when dependencies change
```

## Testing Integration

### Manual Testing Steps

1. **Start Hardhat Node**:
   ```bash
   npx hardhat node
   ```

2. **Deploy Contracts**:
   ```bash
   npx hardhat run scripts/deploy-lending-pool.ts --network localhost
   ```

3. **Copy Addresses**:
   ```bash
   npx ts-node scripts/copy-artifacts-to-frontend.ts
   ```

4. **Start Frontend**:
   ```bash
   cd frontend && npm run dev
   ```

5. **Test in Browser**:
   - Connect wallet → Check Web3 context updates
   - Mint tokens → Check balances update
   - Supply tokens → Check both approval and deposit work
   - Check health factor → Verify calculations
   - Borrow tokens → Check health factor updates
   - Repay loan → Check debt decreases

### Debugging Tips

**Check Contract Addresses**:
```typescript
console.log('LendingPool:', ADDRESSES.LendingPool);
console.log('WETH:', ADDRESSES.WETH);
```

**Check Contract Instance**:
```typescript
const lendingPool = useContract('LendingPool');
console.log('Contract:', lendingPool);
console.log('Address:', await lendingPool?.getAddress());
```

**Check Transaction Details**:
```typescript
const tx = await contract.deposit(token, amount);
console.log('Transaction hash:', tx.hash);
const receipt = await tx.wait();
console.log('Gas used:', receipt.gasUsed.toString());
```

**Monitor SWR State**:
```typescript
const { data, error, isLoading } = useSWR(key, fetcher);
console.log('Data:', data);
console.log('Error:', error);
console.log('Loading:', isLoading);
```

## Common Integration Issues

### Issue: "Contract not deployed at address"
**Cause**: Wrong address in .env.local
**Fix**: Update addresses after deployment

### Issue: "User rejected transaction"
**Cause**: User clicked "Reject" in MetaMask
**Fix**: User error, ask to retry

### Issue: "Insufficient funds for gas"
**Cause**: Account has no ETH
**Fix**: Import Hardhat test account with ETH

### Issue: "Execution reverted"
**Cause**: Contract validation failed
**Fix**: Check contract requirements (balance, health factor, etc.)

### Issue: "Network mismatch"
**Cause**: MetaMask on wrong network
**Fix**: Switch to Hardhat network (31337)

## Next Steps

Once frontend integration is working:

1. **Phase 6**: Add analytics dashboard
2. **Mainnet Preparation**: Audit contracts
3. **Production Deployment**: Deploy to testnet/mainnet
4. **E2E Testing**: Automated browser tests
5. **Performance**: Optimize gas usage
6. **Security**: Add rate limiting, input sanitization

---

**Frontend successfully integrated with smart contracts!** 🎉
