# DeFi Lending & Borrowing Platform - Architecture

This document provides a comprehensive technical overview of the DeFi Lending & Borrowing Platform architecture, explaining how each component works and interacts.

## Table of Contents

1. [Overview](#overview)
2. [Liquidity Pools](#liquidity-pools)
3. [Over-Collateralization](#over-collateralization)
4. [Interest Rate Model](#interest-rate-model)
5. [Oracle Design](#oracle-design)
6. [Health Factor](#health-factor)
7. [LAR Rewards](#lar-rewards)
8. [Smart Contract Architecture](#smart-contract-architecture)
9. [Frontend Architecture](#frontend-architecture)
10. [Security Considerations](#security-considerations)

## Overview

The DeFi Lending & Borrowing Platform is a pool-based lending protocol where users can:

- **Supply assets** to earn interest and LAR rewards
- **Borrow assets** against their supplied collateral
- **Earn dynamic interest** based on market utilization
- **Monitor health** to avoid liquidations

### Key Design Principles

- **Pool-Based**: All lenders supply to shared pools (not P2P)
- **Over-Collateralized**: Borrowers must deposit collateral worth more than their debt
- **Dynamic Rates**: Interest rates adjust based on supply and demand
- **Decentralized Pricing**: Chainlink oracles for accurate price feeds
- **Incentivized Lending**: LAR reward tokens encourage liquidity provision

## Liquidity Pools

### Pool-Based vs. P2P Lending

**Pool-Based (This Protocol)**:

```
Lender A ----\
Lender B ------> Shared Pool ----> Borrower X
Lender C ----/                \--> Borrower Y
```

**Advantages**:

- **Instant Liquidity**: Lenders can withdraw anytime (if liquidity available)
- **Fungibility**: All supplied assets are treated equally
- **Better Rates**: Utilization-based rates benefit both sides
- **Scalability**: No matching required

**How It Works**:

1. User supplies tokens to the pool
2. Pool tracks `totalDeposits[token]` and `totalBorrows[token]`
3. User receives LAR tokens representing their share
4. Interest accrues to all lenders proportionally
5. User can withdraw up to their deposited amount (minus borrowed if collateral)

### Pool State Management

```solidity
// State variables in LendingPool
mapping(address => uint256) public totalDeposits;  // Total supplied per token
mapping(address => uint256) public totalBorrows;   // Total borrowed per token
mapping(address => mapping(address => UserReserveData)) public userReserves;

struct UserReserveData {
    uint256 deposited;  // User's deposit
    uint256 borrowed;   // User's borrow
    uint256 lastInterestIndex;  // For future compounding
}
```

## Over-Collateralization

### Why Over-Collateralization?

In traditional finance, loans are under-collateralized because:

- Identity verification ensures accountability
- Legal recourse for defaults
- Credit scores assess risk

In DeFi:

- **Pseudonymous**: No identity verification
- **No Legal Recourse**: Can't sue anonymous address
- **No Credit History**: Every address is equal

**Solution**: Require collateral worth MORE than the loan.

### Loan-to-Value (LTV) Ratios

Each token has a specific LTV ratio representing maximum borrowing power:

| Token | LTV  | Rationale                              |
| ----- | ---- | -------------------------------------- |
| WETH  | 75%  | Liquid, widely accepted                |
| DAI   | 80%  | Stablecoin, low volatility             |
| USDC  | 80%  | Stablecoin, centralized but stable     |
| LINK  | 60%  | More volatile, higher liquidation risk |

### Borrowing Power Calculation

**Formula**:

```
Borrowing Power = Σ (Collateral_i × Price_i × LTV_i)
```

**Example**:

```
User deposits:
- 10 WETH @ $2,000 = $20,000 × 75% = $15,000
- 5,000 DAI @ $1 = $5,000 × 80% = $4,000
- 1,000 USDC @ $1 = $1,000 × 80% = $800

Total Borrowing Power = $15,000 + $4,000 + $800 = $19,800
```

The user can borrow up to $19,800 worth of any supported token.

### Liquidation Threshold

The liquidation threshold is typically set at 80% for most tokens:

```
Liquidation Threshold = LTV + Buffer (usually 5-10%)
```

For example, WETH with 75% LTV might have an 80% liquidation threshold, meaning liquidation occurs when debt reaches 80% of collateral value.

## Interest Rate Model

### Dual-Slope Algorithm

The interest rate model is inspired by Aave's approach with two slopes:

```
        |
        |                                  /
        |                                 /
 Rate   |                                / Slope2 (steep)
        |                               /
        |                         ____/
        |                   _____/  Slope1 (gentle)
        |              ____/
        |________-----/
        |____________________________________________
        0%          80% (Optimal)              100%
                    Utilization
```

### Parameters

- **Base Rate**: 2% (minimum interest at 0% utilization)
- **Slope 1**: 0.08 (8% rate at optimal 80% utilization)
- **Slope 2**: 1.5 (150% rate increase above optimal)
- **Optimal Utilization**: 80%

### Formula

**If Utilization < Optimal (80%)**:

```
Borrow Rate = Base Rate + (Utilization × Slope1)
            = 2% + (Utilization × 0.08)
```

**If Utilization ≥ Optimal (80%)**:

```
Borrow Rate = Base Rate + (Optimal × Slope1) + ((Utilization - Optimal) × Slope2)
            = 2% + (0.80 × 0.08) + ((Utilization - 0.80) × 1.5)
```

### Example Interest Rates

| Utilization | Borrow APY | Supply APY (Util × Borrow) |
| ----------- | ---------- | -------------------------- |
| 0%          | 2.00%      | 0.00%                      |
| 25%         | 4.00%      | 1.00%                      |
| 50%         | 6.00%      | 3.00%                      |
| 80%         | 10.00%     | 8.00%                      |
| 90%         | 25.00%     | 22.50%                     |
| 95%         | 40.00%     | 38.00%                     |

### Supply APY Calculation

```
Supply APY = Borrow APY × Utilization Rate
```

This ensures lenders earn interest proportional to how much of their capital is being used.

### Why This Model?

- **Encourages Balance**: Low rates when underutilized encourage borrowing
- **Protects Liquidity**: High rates at high utilization discourage over-borrowing
- **Market-Driven**: Rates automatically adjust based on supply and demand
- **Predictable**: Users can anticipate rate changes based on utilization

## Oracle Design

### Chainlink Integration

The protocol uses Chainlink Price Feeds for decentralized, tamper-resistant price data.

```solidity
// PriceOracle.sol
contract PriceOracle is Ownable {
    mapping(address => address) public priceFeeds;  // token => Chainlink feed
    uint256 public constant STALENESS_THRESHOLD = 3600;  // 1 hour

    function getPrice(address token) external view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeeds[token]);
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();

        require(price > 0, "Invalid price");
        require(block.timestamp - updatedAt <= STALENESS_THRESHOLD, "Stale price");

        // Normalize to 18 decimals
        return uint256(price) * 10 ** (18 - priceFeed.decimals());
    }
}
```

### Price Normalization

Chainlink feeds return different decimal precisions:

- **USD pairs**: 8 decimals (e.g., ETH/USD = 200000000000 = $2,000.00)
- **Crypto pairs**: 18 decimals

Our oracle normalizes all prices to **18 decimals** for consistent calculations:

```solidity
// Normalize 8-decimal Chainlink price to 18 decimals
normalizedPrice = chainlinkPrice * 10^(18 - 8)
                = chainlinkPrice * 10^10
```

### Staleness Protection

Prices are considered **stale** if not updated within 1 hour:

```solidity
require(block.timestamp - updatedAt <= STALENESS_THRESHOLD, "Stale price");
```

This prevents using outdated prices that could enable attacks during network issues.

### Attack Mitigation

- **Decentralized Feeds**: Multiple oracle nodes provide consensus
- **Time-Weighted Average**: Chainlink aggregates data over time
- **Deviation Threshold**: Large price swings require multiple confirmations
- **Staleness Checks**: Reject old data

## Health Factor

### What is Health Factor?

The health factor represents how close a user is to liquidation:

```
Health Factor = (Total Collateral × Liquidation Threshold) / Total Debt
```

### Interpretation

- **HF > 1.5**: Safe (green) - plenty of collateral cushion
- **HF 1.0 - 1.5**: Warning (yellow) - approaching liquidation risk
- **HF < 1.0**: Danger (red) - subject to liquidation

### Calculation Example

**User's Position**:

- Collateral: 10 WETH @ $2,000 = $20,000
- Liquidation Threshold: 80% (0.80)
- Debt: 10,000 DAI @ $1 = $10,000

**Health Factor**:

```
HF = ($20,000 × 0.80) / $10,000
   = $16,000 / $10,000
   = 1.6  (Safe)
```

**After Price Drop** (WETH drops to $1,600):

```
HF = ($16,000 × 0.80) / $10,000
   = $12,800 / $10,000
   = 1.28  (Warning)
```

**After Further Drop** (WETH drops to $1,200):

```
HF = ($12,000 × 0.80) / $10,000
   = $9,600 / $10,000
   = 0.96  (DANGER - Can be liquidated!)
```

### Multi-Collateral Health Factor

For users with multiple collateral types:

```solidity
function calculateHealthFactor(address user) public view returns (uint256) {
    uint256 totalCollateralUSD = 0;
    uint256 totalDebtUSD = 0;

    // Sum all collateral with liquidation thresholds
    for (each deposited token) {
        collateralValue = depositAmount × price × liquidationThreshold;
        totalCollateralUSD += collateralValue;
    }

    // Sum all debt
    for (each borrowed token) {
        debtValue = borrowAmount × price;
        totalDebtUSD += debtValue;
    }

    if (totalDebtUSD == 0) return type(uint256).max;  // No debt = infinite HF

    return (totalCollateralUSD × 1e18) / totalDebtUSD;
}
```

### Liquidation Process

When HF < 1.0:

1. Liquidator identifies underwater position
2. Liquidator repays portion of user's debt
3. Liquidator receives user's collateral + bonus (e.g., 5%)
4. User's position improves or is closed

**Note**: Liquidation logic is conceptual in this educational implementation.

## LAR Rewards

### What are LAR Tokens?

LAR (Lending And Rewards) tokens are ERC20 reward tokens minted to lenders when they supply assets.

### Minting Mechanism

**Formula**: 1 LAR = $1 USD value supplied

```solidity
function deposit(address token, uint256 amount) external {
    // Calculate USD value
    uint256 price = priceOracle.getPrice(token);  // 18 decimals
    uint8 decimals = IERC20Metadata(token).decimals();
    uint256 usdValue = (amount × price) / (10 ** decimals);

    // Mint LAR 1:1 with USD value
    larToken.mint(msg.sender, usdValue);

    emit Deposit(msg.sender, token, amount, usdValue);
}
```

### Example

**User supplies 5 WETH @ $2,000**:

```
USD Value = 5 × $2,000 = $10,000
LAR Minted = 10,000 LAR tokens
```

**User supplies 1,000 DAI @ $1**:

```
USD Value = 1,000 × $1 = $1,000
LAR Minted = 1,000 LAR tokens
```

### Burning on Withdrawal

When users withdraw, LAR tokens are burned proportionally:

```solidity
function withdraw(address token, uint256 amount) external {
    uint256 usdValue = calculateUSDValue(token, amount);
    larToken.burn(msg.sender, usdValue);  // Burn LAR

    // Transfer tokens back to user
}
```

### Benefits

- **Incentivize Lending**: Users earn LAR just for providing liquidity
- **Track Participation**: LAR supply shows total protocol TVL
- **Future Utility**: LAR could grant governance rights, fee discounts, etc.
- **Simple Mechanism**: No complex reward distribution needed

## Smart Contract Architecture

### Contract Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      LendingPool                        │
│  - deposit()                                            │
│  - withdraw()                                           │
│  - borrow()                                             │
│  - repay()                                              │
│  - calculateHealthFactor()                              │
│  - getUserAccountData()                                 │
└───────────────┬──────────────┬────────────────┬─────────┘
                │              │                │
        ┌───────▼──────┐  ┌────▼────────┐  ┌───▼─────────┐
        │  LARToken    │  │ PriceOracle │  │ InterestRate│
        │  - mint()    │  │ - getPrice()│  │ Model       │
        │  - burn()    │  │             │  │ - calculate │
        └──────────────┘  └─────┬───────┘  │   Rate()    │
                                │          └─────────────┘
                          ┌─────▼──────────────┐
                          │ Chainlink          │
                          │ AggregatorV3       │
                          │ Interface          │
                          └────────────────────┘
```

### Contract Interactions

**Deposit Flow**:

1. User calls `LendingPool.deposit(token, amount)`
2. LendingPool transfers tokens from user
3. LendingPool calls `PriceOracle.getPrice(token)`
4. PriceOracle queries Chainlink feed
5. LendingPool calculates USD value
6. LendingPool calls `LARToken.mint(user, usdValue)`
7. Event emitted

**Borrow Flow**:

1. User calls `LendingPool.borrow(token, amount)`
2. LendingPool calculates user's borrowing power
3. LendingPool calls `PriceOracle.getPrice()` for all user's collateral
4. LendingPool verifies health factor remains > 1.0
5. LendingPool calls `InterestRateModel.calculateInterestRate()`
6. LendingPool transfers tokens to user
7. Event emitted

### Access Control

```solidity
// LendingPool
- Public: deposit, withdraw, borrow, repay (any user)
- Owner Only: addToken, deactivateToken (admin)

// LARToken
- Owner Only: mint, burn (only LendingPool can call)

// PriceOracle
- Owner Only: setPriceFeed (admin sets Chainlink feeds)

// InterestRateModel
- Public: calculateInterestRate (view function)
```

### Key State Variables

**LendingPool**:

```solidity
mapping(address => TokenConfig) public tokenConfigs;
mapping(address => mapping(address => UserReserveData)) public userReserves;
mapping(address => uint256) public totalDeposits;
mapping(address => uint256) public totalBorrows;
```

**PriceOracle**:

```solidity
mapping(address => address) public priceFeeds;  // token => Chainlink feed
```

## Frontend Architecture

### Component Hierarchy

```
App (page.tsx)
├── WalletConnect
├── HealthFactor
├── Tabs
│   ├── SupplyAssets
│   │   └── SupplyModal
│   ├── YourSupplies
│   │   └── WithdrawModal
│   ├── BorrowAssets
│   │   └── BorrowModal
│   ├── YourBorrows
│   │   └── RepayModal
│   └── Faucet
│       └── FaucetButton

Analytics (analytics/page.tsx)
├── ProtocolStats
└── TokenMarkets
```

### Hooks

**useWeb3** - Wallet connection and contract instances:

```typescript
const { isConnected, address, signer, contracts, connect, disconnect } =
  useWeb3();
```

**useUserData** - User's positions and health factor:

```typescript
const { supplies, borrows, healthFactor, loading, refreshData } =
  useUserData();
```

**useProtocolData** - Protocol-wide statistics:

```typescript
const { tokenStats, protocolStats, loading } = useProtocolData();
```

### Data Flow

```
User Action (Click "Supply")
       ↓
Component calls contract method
       ↓
MetaMask prompts for signature
       ↓
Transaction submitted to blockchain
       ↓
Wait for confirmation (toast notification)
       ↓
SWR hook refreshes data (5s interval)
       ↓
UI updates with new balances
```

### State Management

- **SWR**: Automatic data fetching and revalidation
- **React Context**: Wallet connection state
- **Local State**: UI interactions (modals, tabs)

### Real-Time Updates

All data hooks use SWR with 5-second refresh intervals:

```typescript
const { data } = useSWR(
  isConnected ? ["userSupplies", address] : null,
  fetchUserSupplies,
  { refreshInterval: 5000 }
);
```

## Security Considerations

### Implemented Protections

**1. Reentrancy Protection**

Uses checks-effects-interactions pattern:

```solidity
function withdraw(address token, uint256 amount) external {
    // Checks
    require(amount > 0, "Amount must be greater than 0");
    require(userReserves[msg.sender][token].deposited >= amount, "Insufficient balance");

    // Effects (update state BEFORE external calls)
    userReserves[msg.sender][token].deposited -= amount;
    totalDeposits[token] -= amount;

    // Interactions (external calls LAST)
    IERC20(token).transfer(msg.sender, amount);
}
```

**2. Access Control**

Critical functions restricted to owner:

```solidity
function addToken(address token, uint16 ltv) external onlyOwner {
    // Only admin can add new tokens
}
```

**3. Input Validation**

All inputs validated:

```solidity
require(amount > 0, "Amount must be greater than 0");
require(token != address(0), "Invalid token address");
require(ltv > 0 && ltv <= BASIS_POINTS, "Invalid LTV");
```

**4. Integer Overflow Protection**

Solidity 0.8+ has built-in overflow checks. Use `unchecked` only where safe:

```solidity
unchecked {
    userReserves[msg.sender][token].deposited += amount;  // Safe: adding
}
```

**5. Price Staleness Checks**

Oracle rejects stale prices:

```solidity
require(block.timestamp - updatedAt <= STALENESS_THRESHOLD, "Stale price");
```

**6. Health Factor Validation**

All borrows must maintain HF > 1.0:

```solidity
uint256 healthFactor = calculateHealthFactor(msg.sender);
require(healthFactor >= HEALTH_FACTOR_PRECISION, "Health factor too low");
```

### Known Limitations (Educational Project)

⚠️ This is an educational implementation. Production systems would need:

- **Flash Loan Protection**: Prevent single-transaction attacks
- **Liquidation Mechanism**: Actual liquidation implementation
- **Governance**: Decentralized parameter updates
- **Emergency Pause**: Circuit breaker for emergencies
- **Formal Verification**: Mathematical proof of correctness
- **Professional Audit**: Third-party security review
- **Bug Bounty**: Incentivize vulnerability discovery
- **Gradual Rollout**: Test with limited funds first
- **Insurance Fund**: Cover potential shortfalls

### Best Practices Followed

✅ Immutable variables where possible  
✅ Events for all state changes  
✅ NatSpec documentation  
✅ Comprehensive test coverage  
✅ Gas optimization  
✅ Clear error messages  
✅ Modular design  
✅ Standard interfaces (ERC20, Chainlink)

## Conclusion

This architecture balances:

- **Security**: Protection against common attack vectors
- **Efficiency**: Gas-optimized operations
- **Usability**: Clear UX and comprehensive documentation
- **Educational Value**: Well-commented code explaining DeFi concepts

For questions or improvements, see [CONTRIBUTING.md](./CONTRIBUTING.md).
