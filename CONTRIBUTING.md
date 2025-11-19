# Contributing to DeFi Lending & Borrowing Platform

Thank you for your interest in contributing! This guide will help you get started with contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Style](#code-style)
5. [Testing Requirements](#testing-requirements)
6. [Documentation Standards](#documentation-standards)
7. [Pull Request Process](#pull-request-process)
8. [Issue Guidelines](#issue-guidelines)
9. [Security](#security)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, trolling, or discriminatory comments
- Personal attacks or insults
- Publishing others' private information
- Other conduct that could reasonably be considered inappropriate

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18+ installed
- Git installed and configured
- MetaMask browser extension (for testing)
- Basic understanding of Solidity and TypeScript
- Familiarity with Hardhat and ethers.js

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/DeFi-LeBo-SimApp.git
   cd DeFi-LeBo-SimApp
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/DeFi-LeBo-SimApp.git
   ```

### Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Verify Setup

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Start local node
npx hardhat node
```

All tests should pass before you start making changes.

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

**Branch Naming Convention**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/improvements

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/YourTest.test.ts

# Check coverage
npx hardhat coverage
```

Ensure:
- ✅ All existing tests pass
- ✅ New tests added for new functionality
- ✅ Coverage remains at 100%

### 4. Commit Changes

Use conventional commit messages:

```bash
git add .
git commit -m "feat: add liquidation mechanism"
```

**Commit Message Format**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring without changing behavior
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:

```bash
feat(LendingPool): add flash loan functionality
fix(PriceOracle): handle stale price feeds correctly
docs(README): update installation instructions
test(InterestRateModel): add edge case tests
refactor(LARToken): optimize minting logic
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

### Solidity

Follow the [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ContractName
 * @notice Brief description
 * @dev Detailed implementation notes
 */
contract ContractName is Ownable {
    // Constants (UPPER_SNAKE_CASE)
    uint256 public constant MAX_SUPPLY = 1_000_000 * 1e18;
    
    // Immutable variables
    address public immutable tokenAddress;
    
    // State variables (camelCase)
    uint256 public totalSupply;
    mapping(address => uint256) public balances;
    
    // Events (PascalCase)
    event Deposit(address indexed user, uint256 amount);
    
    // Errors (PascalCase with Error suffix)
    error InsufficientBalance(uint256 requested, uint256 available);
    
    // Modifiers (camelCase)
    modifier onlyPositive(uint256 amount) {
        require(amount > 0, "Amount must be positive");
        _;
    }
    
    /**
     * @notice Constructor description
     * @param _token Token address
     */
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token");
        tokenAddress = _token;
    }
    
    /**
     * @notice Deposit tokens
     * @param amount Amount to deposit
     */
    function deposit(uint256 amount) external onlyPositive(amount) {
        // Checks
        require(balances[msg.sender] + amount <= MAX_SUPPLY, "Exceeds max");
        
        // Effects
        balances[msg.sender] += amount;
        totalSupply += amount;
        
        // Interactions (external calls last)
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        
        emit Deposit(msg.sender, amount);
    }
    
    // Internal functions (prefix with _)
    function _calculateReward(uint256 amount) internal pure returns (uint256) {
        return amount * 10 / 100; // 10% reward
    }
}
```

**Key Points**:
- Use NatSpec comments (`@notice`, `@dev`, `@param`, `@return`)
- Follow checks-effects-interactions pattern
- Use custom errors for gas optimization (Solidity 0.8.4+)
- Name internal functions with `_` prefix
- Use `immutable` for constants set in constructor
- Group by visibility: external, public, internal, private

### TypeScript

Follow the [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html):

```typescript
import { ethers } from 'ethers';
import type { Contract } from 'ethers';

/**
 * Interface for token configuration
 */
interface TokenConfig {
  address: string;
  symbol: string;
  decimals: number;
  ltv: number; // Basis points (7500 = 75%)
}

/**
 * Fetch user's deposit balance
 * @param contract - LendingPool contract instance
 * @param userAddress - User's wallet address
 * @param tokenAddress - Token address
 * @returns Deposit amount as BigInt
 */
export async function getUserDeposit(
  contract: Contract,
  userAddress: string,
  tokenAddress: string
): Promise<bigint> {
  try {
    const deposit = await contract.getUserDeposit(userAddress, tokenAddress);
    return deposit;
  } catch (error) {
    console.error('Error fetching deposit:', error);
    throw error;
  }
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number
): string {
  const formatted = ethers.formatUnits(amount, decimals);
  return parseFloat(formatted).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}
```

**Key Points**:
- Use TypeScript strict mode
- Add type annotations for function parameters and returns
- Use JSDoc comments for public functions
- Prefer `const` over `let`
- Use async/await over promises
- Handle errors appropriately
- Use meaningful variable names

### React/Next.js

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';

interface Props {
  tokenAddress: string;
  onSuccess?: () => void;
}

/**
 * Component for supplying tokens
 */
export default function SupplyToken({ tokenAddress, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { contracts, address } = useWeb3();

  const handleSupply = async () => {
    if (!contracts.lendingPool || !address) return;

    try {
      setLoading(true);
      
      const tx = await contracts.lendingPool.deposit(
        tokenAddress,
        ethers.parseEther(amount)
      );
      
      await tx.wait();
      
      onSuccess?.();
    } catch (error) {
      console.error('Supply failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        className="w-full px-4 py-2 border rounded"
      />
      <button
        onClick={handleSupply}
        disabled={loading || !amount}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Supplying...' : 'Supply'}
      </button>
    </div>
  );
}
```

**Key Points**:
- Use functional components with hooks
- Destructure props in function signature
- Use TypeScript interfaces for props
- Handle loading and error states
- Use semantic HTML
- Follow Tailwind CSS conventions
- Add 'use client' for client components (Next.js 14)

## Testing Requirements

### All Changes Must Include Tests

For every change, add corresponding tests:

**New Feature**:
- Unit tests for all new functions
- Integration tests if multiple contracts interact
- Edge case tests
- Error condition tests

**Bug Fix**:
- Test that reproduces the bug (should fail initially)
- Fix the bug
- Verify test now passes
- Add additional edge case tests

**Refactoring**:
- All existing tests must still pass
- No decrease in coverage

### Test Structure

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Feature", function () {
  // Setup fixture
  async function setupFixture() {
    const [owner, user1] = await ethers.getSigners();
    // Deploy contracts
    return { owner, user1, /* contracts */ };
  }

  describe("Normal Cases", function () {
    it("Should handle valid input", async function () {
      const { contract, user1 } = await loadFixture(setupFixture);
      // Test code
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount", async function () {
      // Test code
    });

    it("Should handle maximum amount", async function () {
      // Test code
    });
  });

  describe("Error Cases", function () {
    it("Should revert on invalid input", async function () {
      // Test code
    });
  });
});
```

### Coverage Requirements

- **Target**: 100% coverage
- **Minimum**: 95% coverage
- Run `npx hardhat coverage` before submitting PR
- No decrease in overall coverage allowed

## Documentation Standards

### Code Documentation

**Solidity** - Use NatSpec:

```solidity
/**
 * @notice Borrow tokens against collateral
 * @dev Requires sufficient collateral and healthy position
 * @param token Address of token to borrow
 * @param amount Amount to borrow
 */
function borrow(address token, uint256 amount) external {
    // Implementation
}
```

**TypeScript** - Use JSDoc:

```typescript
/**
 * Calculate health factor for user
 * @param userAddress - User's wallet address
 * @returns Health factor as number (1.5 = 150%)
 */
async function calculateHealthFactor(userAddress: string): Promise<number> {
  // Implementation
}
```

### README Updates

If your change affects usage:

- Update [README.md](../README.md)
- Update relevant documentation in `docs/`
- Add examples if introducing new features

### Architecture Documentation

If your change affects architecture:

- Update [ARCHITECTURE.md](../ARCHITECTURE.md)
- Add diagrams if helpful (Mermaid or ASCII)
- Explain design decisions

## Pull Request Process

### Before Submitting

Checklist:

- [ ] All tests pass locally
- [ ] Coverage at 100% (or not decreased)
- [ ] Code follows style guidelines
- [ ] No console.log or debugging code left
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

### PR Template

Use this template for your PR description:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] All existing tests pass
- [ ] Added tests for new functionality
- [ ] Tested locally with frontend
- [ ] Coverage: X%

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No warnings in console
- [ ] Tests added/updated

## Screenshots (if applicable)

Add screenshots for UI changes

## Related Issues

Closes #issue_number
```

### Review Process

1. Automated checks run (tests, linting)
2. At least one maintainer reviews code
3. Address feedback and push updates
4. Once approved, maintainer merges

### After Merge

- Delete your feature branch
- Update your fork's main branch
- Celebrate! 🎉

## Issue Guidelines

### Before Creating an Issue

- Search existing issues to avoid duplicates
- Check documentation and troubleshooting guide
- Verify issue exists on latest version

### Issue Template

**Bug Report**:

```markdown
## Bug Description

Clear description of the bug

## Steps to Reproduce

1. Step one
2. Step two
3. See error

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- OS: Windows/macOS/Linux
- Node version: X.X.X
- Browser: Chrome/Firefox/etc.

## Screenshots/Logs

Add any error messages or screenshots
```

**Feature Request**:

```markdown
## Feature Description

What feature you'd like to see

## Use Case

Why this feature is needed

## Proposed Solution

How you think it should work

## Alternatives Considered

Other approaches you've thought about
```

## Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:

1. Email security@example.com (replace with actual email)
2. Include detailed description
3. Include steps to reproduce
4. Wait for response before disclosing publicly

### Security Considerations

When contributing:

- Never commit private keys or secrets
- Use `.env` for sensitive configuration
- Follow security best practices:
  - Checks-effects-interactions pattern
  - Input validation
  - Access control
  - Integer overflow protection

## Development Tips

### Useful Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run specific test
npx hardhat test test/LendingPool.test.ts

# Coverage
npx hardhat coverage

# Gas report
REPORT_GAS=true npx hardhat test

# Clean artifacts
npx hardhat clean

# Start local node
npx hardhat node

# Deploy locally
npx hardhat run scripts/deploy-lending-pool.ts --network localhost

# Frontend dev server
cd frontend && npm run dev
```

### Debugging

**Solidity**:

```solidity
import "hardhat/console.sol";

function myFunction() {
    console.log("Value:", myValue);
}
```

**TypeScript**:

```typescript
console.log('Debug:', { variable1, variable2 });
```

**Tests**:

```bash
# Verbose output
npx hardhat test --verbose

# Stack traces
npx hardhat test --show-stack-traces
```

## Getting Help

- **Documentation**: Check docs/ folder
- **Issues**: Search existing issues
- **Discussions**: GitHub Discussions
- **Discord**: Join community Discord
- **Stack Overflow**: Tag with `defi-lending`

## Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes for significant contributions
- Appreciated in community shout-outs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🙏

Your efforts help make this educational platform better for everyone learning DeFi development.
