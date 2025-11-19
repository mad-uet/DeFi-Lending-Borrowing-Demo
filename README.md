# DeFi Lending & Borrowing Simulation

A gas-optimized DeFi lending and borrowing protocol simulation built with Hardhat, TypeScript, and Solidity 0.8.20.

## Phase 1: Project Setup & Foundation ✅

### Overview
Phase 1 establishes the foundational infrastructure for the DeFi protocol, including:
- Hardhat development environment with TypeScript
- Mock ERC20 tokens for testing (WETH, DAI, USDC, LINK)
- Mock Chainlink price feed oracles
- Comprehensive test suite with 100% coverage

### Technology Stack
- **Hardhat**: v2.22.0 (Development environment)
- **Solidity**: v0.8.20 (Smart contract language)
- **TypeScript**: v5.3.3 (Type-safe development)
- **Ethers.js**: v6.10.0 (Ethereum library)
- **OpenZeppelin**: v5.0.1 (Secure contract implementations)
- **Chainlink**: v0.8.0 (Price feed interfaces)
- **Chai**: v4.3.10 (Testing framework)

### Project Structure
```
DeFi-LeBo-SimApp/
├── contracts/
│   └── mocks/
│       ├── MockERC20.sol           # Gas-optimized ERC20 for testing
│       └── MockV3Aggregator.sol    # Chainlink price feed mock
├── scripts/
│   └── deploy-mocks.ts             # Deployment script for all mocks
├── test/
│   ├── setup.test.ts               # Hardhat connectivity tests
│   └── mocks/
│       ├── MockERC20.test.ts       # ERC20 token tests
│       └── MockV3Aggregator.test.ts # Price feed tests
├── hardhat.config.ts               # Hardhat configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Project dependencies
```

### Smart Contracts

#### MockERC20
A gas-optimized ERC20 token implementation for testing purposes.

**Features:**
- Extends OpenZeppelin's ERC20 implementation
- Customizable decimals (18 for WETH/DAI/LINK, 6 for USDC)
- Public mint function (anyone can mint for testing)
- Immutable decimals for gas savings

**Key Functions:**
```solidity
constructor(string memory name_, string memory symbol_, uint8 decimals_)
function mint(address to, uint256 amount) external
function decimals() public view override returns (uint8)
```

**Gas Optimization:**
- Uses `immutable` for decimals storage
- Inherits optimized OpenZeppelin implementation
- Average mint cost: ~67,003 gas
- Average transfer cost: ~51,628 gas

#### MockV3Aggregator
A mock implementation of Chainlink's AggregatorV3Interface for testing.

**Features:**
- Implements Chainlink's price feed interface
- Configurable decimals (8 for USD pairs, 18 for crypto pairs)
- Public price update function for testing
- Round ID tracking

**Key Functions:**
```solidity
constructor(uint8 _decimals, int256 _initialAnswer)
function updateAnswer(int256 _answer) external
function latestRoundData() external view returns (...)
function version() external pure returns (uint256)
function description() external pure returns (string memory)
```

**Gas Optimization:**
- Uses `immutable` for decimals
- Uses `unchecked` for safe round ID increment
- Average update cost: ~35,879 gas
- Minimal deployment cost: ~244,130 gas

### Deployed Mock Tokens

| Token | Symbol | Decimals | Initial Price | Use Case |
|-------|--------|----------|---------------|----------|
| Wrapped Ether | WETH | 18 | $2,000 | Collateral asset |
| Dai Stablecoin | DAI | 18 | $1 | Borrowing asset |
| USD Coin | USDC | 6 | $1 | Borrowing asset |
| Chainlink Token | LINK | 18 | $15 | Collateral asset |

### Setup Instructions

1. **Install Dependencies**
```bash
npm install
```

2. **Compile Contracts**
```bash
npm run compile
```

3. **Run Tests**
```bash
npm test
```

4. **Run Tests with Gas Reporter**
```bash
$env:REPORT_GAS='true'; npm test  # PowerShell
# OR
REPORT_GAS=true npm test          # Bash
```

5. **Deploy to Local Network**
```bash
# Terminal 1: Start local node
npm run node

# Terminal 2: Deploy mocks
npm run deploy:local
```

### Test Coverage

**34 Tests Passing**
- ✅ Hardhat Setup (3 tests)
- ✅ MockERC20 (15 tests)
  - Deployment validation
  - Minting functionality
  - Token transfers
  - Approval & transferFrom
  - Custom decimals support
- ✅ MockV3Aggregator (16 tests)
  - Deployment validation
  - Price updates
  - Round data tracking
  - Different decimal configurations
  - Version & description

### TDD Approach

Phase 1 was developed following strict Test-Driven Development:

1. **Write Failing Test** → Write test for desired functionality
2. **Implement Minimal Code** → Add just enough code to pass
3. **Tests Pass** → Verify all tests pass
4. **Refactor** → Optimize for gas and code quality

Example workflow:
1. ✅ Wrote failing MockERC20 tests
2. ✅ Implemented MockERC20 contract
3. ✅ All tests passed
4. ✅ Wrote failing MockV3Aggregator tests
5. ✅ Implemented MockV3Aggregator contract
6. ✅ All tests passed
7. ✅ Created deployment script and verified

### Gas Optimization Techniques

1. **Immutable Variables**: Used for decimals in both contracts
2. **Unchecked Math**: Used for safe round ID increment in aggregator
3. **Minimal Storage**: Only essential state variables stored
4. **Inherited Optimization**: Leveraged OpenZeppelin's optimized ERC20

### Next Steps (Phase 2)

Phase 1 is complete! The foundation is ready for:
- LendingPool contract implementation
- Collateral management
- Borrowing and repayment logic
- Interest calculation (simple linear interest)
- Liquidation mechanism

### Commands Reference

```bash
# Development
npm run compile          # Compile contracts
npm test                # Run tests
npm run test:coverage   # Run coverage report
npm run node            # Start local Hardhat network
npm run deploy:local    # Deploy to local network

# Gas Analysis
$env:REPORT_GAS='true'; npm test  # Windows PowerShell
REPORT_GAS=true npm test          # Linux/Mac
```

### Configuration

**Hardhat Network:**
- Chain ID: 31337
- Block Gas Limit: 30,000,000
- Solidity Optimizer: Enabled (200 runs)

**Compiler:**
- Solidity: 0.8.20
- EVM Target: Paris

### License
MIT

---

**Phase 1 Status**: ✅ Complete
- All contracts implemented and tested
- 100% test coverage for mock contracts
- Gas-optimized implementations
- Deployment script functional
- Ready for Phase 2 development
