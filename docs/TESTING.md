# Testing Guide

This document explains how to run tests, understand test structure, write new tests, and interpret coverage reports for the DeFi Lending & Borrowing Platform.

## Table of Contents

1. [Running Tests](#running-tests)
2. [Test Structure](#test-structure)
3. [Test Categories](#test-categories)
4. [Writing New Tests](#writing-new-tests)
5. [Coverage Reports](#coverage-reports)
6. [Gas Optimization Tests](#gas-optimization-tests)
7. [Continuous Integration](#continuous-integration)

## Running Tests

### Run All Tests

```bash
npx hardhat test
```

Expected output: **233+ tests passing** in ~30-60 seconds

### Run Specific Test File

```bash
npx hardhat test test/LendingPool.deposit.test.ts
```

### Run Specific Test Suite

```bash
npx hardhat test --grep "Deposit"
```

This runs all tests containing "Deposit" in their description.

### Run with Gas Reporting

```bash
REPORT_GAS=true npx hardhat test
```

Or on Windows PowerShell:

```powershell
$env:REPORT_GAS='true'; npx hardhat test
```

### Generate Coverage Report

```bash
npx hardhat coverage
```

This creates:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- Console summary of coverage percentages

### Watch Mode (Continuous Testing)

```bash
npx hardhat watch test
```

Re-runs tests automatically when files change (requires `hardhat-watcher` plugin).

---

## Test Structure

### Directory Organization

```
test/
├── setup.test.ts                    # Hardhat connectivity tests
├── mocks/
│   ├── MockERC20.test.ts           # Mock token tests
│   └── MockV3Aggregator.test.ts    # Mock oracle tests
├── LARToken.test.ts                # LAR token tests
├── InterestRateModel.test.ts       # Interest rate tests
├── PriceOracle.test.ts             # Oracle tests
├── LendingPool.deposit.test.ts     # Deposit functionality
├── LendingPool.withdraw.test.ts    # Withdraw functionality
├── LendingPool.borrow.test.ts      # Borrow functionality
├── LendingPool.repay.test.ts       # Repay functionality
├── LendingPool.calculations.test.ts # Health factor & calculations
├── integration.test.ts             # Multi-contract integration
└── scenarios/
    ├── multi-user.test.ts          # Multi-user scenarios
    └── interest-accrual.test.ts    # Interest accrual over time
```

### Test File Template

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("ContractName", function () {
  // Fixture for test setup
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy contracts
    const Contract = await ethers.getContractFactory("ContractName");
    const contract = await Contract.deploy(/* args */);
    
    return { contract, owner, user1, user2 };
  }

  describe("Feature", function () {
    it("Should do something", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);
      
      // Arrange
      // ... setup

      // Act
      await contract.connect(user1).someFunction();

      // Assert
      expect(await contract.someValue()).to.equal(expectedValue);
    });
  });
});
```

### Common Test Patterns

**Arrange-Act-Assert (AAA)**:

```typescript
it("Should increase balance when depositing", async () => {
  // Arrange
  const amount = ethers.parseEther("10");
  await token.mint(user1.address, amount);
  await token.connect(user1).approve(lendingPool.address, amount);

  // Act
  await lendingPool.connect(user1).deposit(token.address, amount);

  // Assert
  expect(await lendingPool.getUserDeposit(user1.address, token.address))
    .to.equal(amount);
});
```

**Expect Reverts**:

```typescript
it("Should revert when amount is zero", async () => {
  await expect(
    lendingPool.deposit(token.address, 0)
  ).to.be.revertedWith("Amount must be greater than 0");
});
```

**Event Emission**:

```typescript
it("Should emit Deposit event", async () => {
  await expect(lendingPool.deposit(token.address, amount))
    .to.emit(lendingPool, "Deposit")
    .withArgs(user1.address, token.address, amount, larAmount);
});
```

**Time Manipulation**:

```typescript
import { time } from "@nomicfoundation/hardhat-network-helpers";

it("Should accrue interest over time", async () => {
  // Initial borrow
  await lendingPool.borrow(token.address, amount);
  
  // Fast-forward 1 year
  await time.increase(365 * 24 * 60 * 60);
  
  // Check accrued interest
  const debt = await lendingPool.getUserDebt(user1.address, token.address);
  expect(debt).to.be.gt(amount); // Greater than borrowed amount
});
```

---

## Test Categories

### 1. Unit Tests (169 tests)

Test individual contract functions in isolation.

**Example**: `LendingPool.deposit.test.ts`

```typescript
describe("LendingPool - Deposit", () => {
  it("Should transfer tokens from user");
  it("Should update user reserve data");
  it("Should update total deposits");
  it("Should mint LAR tokens");
  it("Should emit Deposit event");
  it("Should revert if amount is zero");
  it("Should revert if token not supported");
  it("Should handle different token decimals correctly");
});
```

### 2. Integration Tests (56 tests)

Test interactions between multiple contracts.

**Example**: `integration.test.ts`

```typescript
describe("Integration", () => {
  it("Should deposit, borrow, repay, and withdraw in sequence");
  it("Should calculate health factor correctly with multiple collaterals");
  it("Should update interest rates based on utilization");
  it("Should handle LAR minting and burning across operations");
});
```

### 3. Scenario Tests (8+ tests)

Test real-world use cases with multiple users.

**Example**: `scenarios/multi-user.test.ts`

```typescript
describe("Multi-User Scenarios", () => {
  it("Should handle multiple users depositing simultaneously");
  it("Should calculate correct utilization with multiple borrowers");
  it("Should distribute interest proportionally to lenders");
  it("Should handle concurrent deposits and withdrawals");
});
```

### 4. Edge Case Tests

Test boundary conditions and error states.

**Examples**:
- Maximum/minimum values
- Zero amounts
- Insufficient balances
- Health factor exactly at liquidation threshold
- Price feed staleness
- Rounding errors

---

## Writing New Tests

### Step 1: Identify What to Test

Before writing, ask:
- What is the expected behavior?
- What inputs are valid/invalid?
- What state changes should occur?
- What events should be emitted?
- What edge cases exist?

### Step 2: Create Test File

```bash
touch test/NewFeature.test.ts
```

### Step 3: Write Test Structure

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("NewFeature", function () {
  async function deployFixture() {
    // Deploy all required contracts
    // Return contract instances and signers
  }

  describe("Basic Functionality", function () {
    it("Should work in normal case", async () => {
      // Test implementation
    });

    it("Should revert on invalid input", async () => {
      // Test error case
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum values", async () => {
      // Edge case test
    });
  });
});
```

### Step 4: Use Fixtures for Setup

Fixtures improve test performance by reusing blockchain state:

```typescript
async function setupLendingPool() {
  const [owner, user1, user2] = await ethers.getSigners();
  
  // Deploy tokens
  const WETH = await ethers.getContractFactory("MockERC20");
  const weth = await WETH.deploy("Wrapped Ether", "WETH", 18);
  
  // Deploy core contracts
  const LARToken = await ethers.getContractFactory("LARToken");
  const larToken = await LARToken.deploy(owner.address);
  
  const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
  const interestRateModel = await InterestRateModel.deploy();
  
  // ... deploy other contracts
  
  return {
    weth,
    larToken,
    interestRateModel,
    lendingPool,
    owner,
    user1,
    user2,
  };
}

// Use fixture in tests
it("Should test something", async () => {
  const { lendingPool, user1 } = await loadFixture(setupLendingPool);
  // Test code
});
```

### Step 5: Write Assertions

Use Chai matchers for clear assertions:

```typescript
// Equality
expect(value).to.equal(expected);
expect(value).to.not.equal(unexpected);

// Comparison
expect(value).to.be.gt(threshold);  // Greater than
expect(value).to.be.gte(threshold); // Greater than or equal
expect(value).to.be.lt(max);        // Less than
expect(value).to.be.lte(max);       // Less than or equal

// Boolean
expect(condition).to.be.true;
expect(condition).to.be.false;

// Reverts
await expect(tx).to.be.reverted;
await expect(tx).to.be.revertedWith("Error message");

// Events
await expect(tx)
  .to.emit(contract, "EventName")
  .withArgs(arg1, arg2);

// Changes
await expect(tx)
  .to.changeTokenBalance(token, user, amount);

await expect(tx)
  .to.changeEtherBalance(user, amount);
```

### Step 6: Run Your Tests

```bash
npx hardhat test test/NewFeature.test.ts
```

### Step 7: Add to CI Pipeline

Ensure tests run in CI (GitHub Actions, etc.):

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx hardhat compile
      - run: npx hardhat test
```

---

## Coverage Reports

### Generate Coverage

```bash
npx hardhat coverage
```

### Interpret Coverage Report

Coverage metrics:
- **Statements**: % of code statements executed
- **Branches**: % of if/else branches tested
- **Functions**: % of functions called
- **Lines**: % of code lines executed

**Target**: 100% coverage for all contracts

### View HTML Report

```bash
# Generate coverage
npx hardhat coverage

# Open report in browser
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

### Example Coverage Output

```
-----------------------|----------|----------|----------|----------|----------------|
File                   |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-----------------------|----------|----------|----------|----------|----------------|
 contracts/            |      100 |      100 |      100 |      100 |                |
  InterestRateModel.sol|      100 |      100 |      100 |      100 |                |
  LARToken.sol         |      100 |      100 |      100 |      100 |                |
  LendingPool.sol      |      100 |      100 |      100 |      100 |                |
  PriceOracle.sol      |      100 |      100 |      100 |      100 |                |
 contracts/mocks/      |      100 |      100 |      100 |      100 |                |
  MockERC20.sol        |      100 |      100 |      100 |      100 |                |
  MockV3Aggregator.sol |      100 |      100 |      100 |      100 |                |
-----------------------|----------|----------|----------|----------|----------------|
All files              |      100 |      100 |      100 |      100 |                |
-----------------------|----------|----------|----------|----------|----------------|
```

### Improve Coverage

If coverage is low:

1. **Identify uncovered lines**: Check HTML report
2. **Write tests for uncovered paths**:
   - Test error conditions
   - Test edge cases
   - Test all branches of if/else
3. **Remove dead code**: Delete unreachable code
4. **Re-run coverage**: Verify improvement

---

## Gas Optimization Tests

### Enable Gas Reporting

```bash
REPORT_GAS=true npx hardhat test
```

### Analyze Gas Usage

```
·-----------------------------------------|----------------------------|-------------|-----------------------------·
|   Solc version: 0.8.20                  ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 30000000 gas  │
··········································|····························|·············|······························
|  Methods                                                                                                         │
··························|···············|··············|·············|·············|···············|··············
|  Contract               ·  Method       ·  Min         ·  Max        ·  Avg        ·  # calls      ·  usd (avg)  │
··························|···············|··············|·············|·············|···············|··············
|  LendingPool            ·  deposit      ·       67003  ·     150000  ·      95000  ·           45  ·          -  │
··························|···············|··············|·············|·············|···············|··············
|  LendingPool            ·  borrow       ·       85000  ·     180000  ·     120000  ·           30  ·          -  │
··························|···············|··············|·············|·············|···············|··············
|  LendingPool            ·  repay        ·       60000  ·     140000  ·      88000  ·           25  ·          -  │
··························|···············|··············|·············|·············|···············|··············
|  LendingPool            ·  withdraw     ·       55000  ·     130000  ·      82000  ·           20  ·          -  │
··························|···············|··············|·············|·············|···············|··············
```

### Optimize for Gas

If gas is high:

1. **Use `unchecked` for safe math**:
   ```solidity
   unchecked {
       totalDeposits[token] += amount;  // Safe: adding
   }
   ```

2. **Use `immutable` for constants**:
   ```solidity
   address public immutable larToken;  // Set once in constructor
   ```

3. **Pack storage variables**:
   ```solidity
   struct TokenConfig {
       address tokenAddress;  // 20 bytes
       uint16 ltv;           // 2 bytes
       bool isActive;        // 1 byte
   }  // Total: 23 bytes = 1 storage slot
   ```

4. **Cache storage reads**:
   ```solidity
   // Bad: Multiple SLOAD operations
   if (totalDeposits[token] > 0) {
       utilization = totalBorrows[token] / totalDeposits[token];
   }

   // Good: Cache in memory
   uint256 deposits = totalDeposits[token];  // 1 SLOAD
   if (deposits > 0) {
       utilization = totalBorrows[token] / deposits;
   }
   ```

5. **Use events instead of storage for historical data**

---

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Compile contracts
      run: npx hardhat compile
    
    - name: Run tests
      run: npx hardhat test
    
    - name: Generate coverage
      run: npx hardhat coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
        flags: smartcontracts
```

### Pre-commit Hooks

Use Husky for pre-commit testing:

```bash
npm install --save-dev husky

# Initialize Husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx hardhat test"
```

Now tests run automatically before each commit.

---

## Test Checklist

When adding new features, ensure:

- [ ] Unit tests for all new functions
- [ ] Integration tests for contract interactions
- [ ] Edge case tests (zero values, max values, etc.)
- [ ] Error condition tests (reverts)
- [ ] Event emission tests
- [ ] Gas usage is reasonable
- [ ] Coverage remains at 100%
- [ ] All existing tests still pass
- [ ] Tests are well-documented with clear descriptions

---

## Testing Best Practices

1. **Test behavior, not implementation**: Test what the contract does, not how it does it
2. **Use descriptive test names**: "Should revert when amount is zero" > "Test deposit"
3. **One assertion per test**: Makes failures easier to debug
4. **Use fixtures for setup**: Improves performance and readability
5. **Test edge cases**: 0, 1, max values, boundary conditions
6. **Test reverts**: Ensure proper error handling
7. **Test events**: Verify all state changes emit events
8. **Keep tests independent**: Each test should work in isolation
9. **Mock external dependencies**: Use mock contracts for oracles, etc.
10. **Maintain 100% coverage**: Every line of code should be tested

---

## Troubleshooting Test Issues

**"Timeout of 40000ms exceeded"**:
- Increase timeout in test or config
- Optimize slow test setup
- Use fixtures to cache state

**"VM Exception while processing transaction: reverted"**:
- Add `--verbose` flag for details
- Use `console.log` in Solidity (requires Hardhat console import)
- Check constructor arguments

**"Nonce too high"**:
- Tests may be interacting with persistent state
- Use `loadFixture` to reset state
- Run tests in isolation

**Tests pass individually but fail together**:
- Tests have interdependencies
- Use proper fixtures
- Avoid global state

**Coverage not updating**:
- Clear cache: `npx hardhat clean`
- Delete `coverage/` folder
- Re-run: `npx hardhat coverage`

---

## Additional Resources

- [Hardhat Testing Docs](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Chai Matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)
- [Hardhat Network Helpers](https://hardhat.org/hardhat-network-helpers/docs/overview)
- [Solidity Coverage](https://github.com/sc-forks/solidity-coverage)

---

**Happy Testing!** 🧪

For questions or issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open a GitHub issue.
