## Plan: DeFi Lending & Borrowing Platform

A complete educational DeFi application featuring pool-based lending, over-collateralized borrowing, dynamic interest rates, Chainlink oracle integration, and a full-featured Next.js frontend with MetaMask wallet support. Built with Hardhat v2+, deployed locally for simulation and demonstration.

**Phases: 6**

1. **Phase 1: Project Setup & Foundation**
   - **Objective:** Initialize Hardhat v2+ project with TypeScript, configure development environment, create mock ERC20 tokens (ETH wrapper, DAI, USDC, LINK), and deploy basic token contracts
   - **Files/Functions to Modify/Create:** 
     - `package.json` (Hardhat dependencies)
     - `hardhat.config.ts` (network config, Solidity settings)
     - `contracts/mocks/MockERC20.sol` (test tokens)
     - `contracts/mocks/MockV3Aggregator.sol` (Chainlink oracle mock)
     - `scripts/deploy-mocks.ts` (deployment helper)
   - **Tests to Write:**
     - `test/setup.test.ts` - Verify Hardhat network connectivity
     - `test/mocks/MockERC20.test.ts` - Test token minting, transfers, approvals
     - `test/mocks/MockV3Aggregator.test.ts` - Test price feed updates and retrieval
   - **Steps:**
     1. Initialize npm project and install Hardhat v2.x with TypeScript support
     2. Write failing tests for MockERC20 (mint, transfer, approve)
     3. Implement MockERC20 contract extending OpenZeppelin ERC20
     4. Write failing tests for MockV3Aggregator (price updates, latestRoundData)
     5. Implement MockV3Aggregator simulating Chainlink price feeds
     6. Run tests to confirm green, format with Prettier

2. **Phase 2: Reward Token & Interest Rate Model**
   - **Objective:** Implement LAR reward token (ERC20) for lender incentives and create InterestRateModel contract with dynamic algorithmic rates based on utilization
   - **Files/Functions to Modify/Create:**
     - `contracts/LARToken.sol` (reward token)
     - `contracts/InterestRateModel.sol` (rate calculation logic)
     - `scripts/deploy-core.ts` (deployment script)
   - **Tests to Write:**
     - `test/LARToken.test.ts` - Test minting, transfers, burn functionality
     - `test/InterestRateModel.test.ts` - Test rate calculations at 0%, 50%, 80%, 100% utilization
   - **Steps:**
     1. Write failing tests for LARToken basic ERC20 functionality
     2. Implement LARToken with initial supply (1M tokens)
     3. Write failing tests for InterestRateModel.calculateBorrowRate() with various utilization rates
     4. Implement InterestRateModel using formula: `baseRate + (utilizationRate * rateSlope)`
     5. Test edge cases (0% util = base rate, 100% util = max rate)
     6. Run all tests to confirm green, lint with Solint

3. **Phase 3: Core Lending Pool Contract**
   - **Objective:** Build LendingPool.sol with deposit/withdraw functions, borrow/repay logic, collateral tracking, and integration with InterestRateModel
   - **Files/Functions to Modify/Create:**
     - `contracts/LendingPool.sol` (main protocol logic)
     - `contracts/interfaces/ILendingPool.sol` (interface definition)
     - Helper functions: `deposit()`, `withdraw()`, `borrow()`, `repay()`, `getUserAccountData()`, `getAssetPrice()`
   - **Tests to Write:**
     - `test/LendingPool.deposit.test.ts` - Test deposits, LAR rewards, balance updates
     - `test/LendingPool.withdraw.test.ts` - Test withdrawals, LAR burning, insufficient balance
     - `test/LendingPool.borrow.test.ts` - Test borrowing against collateral, LTV validation
     - `test/LendingPool.repay.test.ts` - Test debt repayment with interest
     - `test/LendingPool.calculations.test.ts` - Test health factor, total collateral, total debt calculations
   - **Steps:**
     1. Write failing tests for deposit() - user deposits DAI, receives LAR rewards
     2. Implement deposit() function with token transfers and LAR minting
     3. Write failing tests for borrow() - verify collateral check, LTV enforcement
     4. Implement borrow() with collateral validation using price feeds
     5. Write failing tests for repay() - verify principal + interest calculation
     6. Implement repay() with dynamic interest from InterestRateModel
     7. Write failing tests for withdraw() - verify available balance after active loans
     8. Implement withdraw() with LAR burning and collateral preservation
     9. Run full test suite, ensure 100% core function coverage

4. **Phase 4: Oracle Integration & Price Feeds**
   - **Objective:** Integrate Chainlink price feed interfaces, implement price aggregation logic, and create token-to-oracle mapping system
   - **Files/Functions to Modify/Create:**
     - `contracts/PriceOracle.sol` (oracle aggregator)
     - `contracts/LendingPool.sol` - Update `getAssetPrice()` to use PriceOracle
     - `scripts/setup-oracles.ts` (map tokens to price feeds)
   - **Tests to Write:**
     - `test/PriceOracle.test.ts` - Test price fetching for all 4 tokens
     - `test/integration/LendingPool.oracle.test.ts` - Test borrow calculations with real-time prices
   - **Steps:**
     1. Write failing tests for PriceOracle.getAssetPrice() with MockV3Aggregator
     2. Implement PriceOracle with Chainlink AggregatorV3Interface
     3. Write failing tests for token-to-feed mapping (ETH/USD, DAI/USD, USDC/USD, LINK/USD)
     4. Implement addPriceFeed() owner function in PriceOracle
     5. Write integration tests - deposit ETH, borrow DAI, verify USD calculations
     6. Update LendingPool to call PriceOracle for all price-dependent operations
     7. Run integration tests with price fluctuations, validate collateral recalculations

5. **Phase 5: Full-Featured Frontend (Next.js + TypeScript)**
   - **Objective:** Build responsive React dashboard with wallet connection, asset tables (supply/borrow), user position tracking, transaction modals, and real-time balance updates
   - **Files/Functions to Modify/Create:**
     - `frontend/package.json` (Next.js, Ethers.js v6, Tailwind CSS)
     - `frontend/pages/index.tsx` (main dashboard)
     - `frontend/components/WalletConnect.tsx` (MetaMask integration)
     - `frontend/components/SupplyAssets.tsx` (available tokens to deposit)
     - `frontend/components/BorrowAssets.tsx` (available tokens to borrow)
     - `frontend/components/YourSupplies.tsx` (user's deposits)
     - `frontend/components/YourBorrows.tsx` (user's active loans)
     - `frontend/components/modals/ModalSupply.tsx` (deposit modal)
     - `frontend/components/modals/ModalBorrow.tsx` (borrow modal)
     - `frontend/components/modals/ModalWithdraw.tsx` (withdraw modal)
     - `frontend/components/modals/ModalRepay.tsx` (repay modal)
     - `frontend/hooks/useContract.ts` (contract interaction)
     - `frontend/hooks/useWeb3.ts` (web3 provider)
     - `frontend/utils/normalize.ts` (data formatting)
   - **Tests to Write:**
     - `frontend/__tests__/WalletConnect.test.tsx` - Test wallet connection flow
     - `frontend/__tests__/SupplyAssets.test.tsx` - Test asset rendering and click handlers
     - `frontend/__tests__/hooks/useContract.test.ts` - Test contract method calls
   - **Steps:**
     1. Initialize Next.js project with TypeScript and Tailwind CSS
     2. Write failing tests for WalletConnect component (MetaMask detection, connection)
     3. Implement WalletConnect with Ethers.js v6 BrowserProvider
     4. Write failing tests for useContract hook (load LendingPool ABI, call methods)
     5. Implement useContract with ethers.Contract and provider/signer management
     6. Write failing tests for SupplyAssets table rendering (4 tokens, APY, balances)
     7. Implement SupplyAssets with SWR for real-time data fetching
     8. Write failing tests for ModalSupply (input validation, approval flow, deposit transaction)
     9. Implement ModalSupply with approve + deposit transaction sequencing
     10. Repeat steps 6-9 for BorrowAssets, YourSupplies, YourBorrows, and remaining modals
     11. Implement health factor visualization (color-coded: green > 1.5, yellow 1.0-1.5, red < 1.0)
     12. Add transaction status toasts with Etherscan-like local transaction links
     13. Run frontend tests, validate E2E user flows with Hardhat local network

6. **Phase 6: Advanced Features & Documentation**
   - **Objective:** Add protocol analytics dashboard, create comprehensive README with setup instructions, prepare demo scenarios, and document architecture for educational presentation
   - **Files/Functions to Modify/Create:**
     - `README.md` (setup guide, architecture explanation)
     - `ARCHITECTURE.md` (detailed system design)
     - `docs/demo-scenarios.md` (walkthrough scripts)
     - `frontend/pages/analytics.tsx` (protocol stats)
     - `scripts/demo-setup.ts` (pre-populate data for demos)
   - **Tests to Write:**
     - `test/scenarios/multi-user.test.ts` - Simulate 3 users interacting (deposit, borrow, repay)
     - `test/scenarios/interest-accrual.test.ts` - Fast-forward time, verify interest accumulation
   - **Steps:**
     1. Write failing tests for multi-user scenario (User A deposits, User B borrows against it)
     2. Implement demo-setup.ts script to fund accounts and execute demo transactions
     3. Write failing tests for analytics page (total TVL, utilization rate, total borrowed)
     4. Implement analytics page with aggregate statistics from LendingPool
     5. Create README.md with: installation steps, contract deployment, frontend launch, testing commands
     6. Create ARCHITECTURE.md explaining: liquidity pools, over-collateralization, interest rate model, oracle design
     7. Create demo-scenarios.md with 3 walkthroughs: (1) Basic deposit/withdraw, (2) Borrowing flow, (3) Interest accrual
     8. Run full test suite (unit + integration + scenarios), ensure all green
     9. Record demo video showing: wallet connection, deposit, borrow, repay, withdraw
     10. Prepare presentation slides highlighting DeFi concepts implemented

**Open Questions:**

1. Should we implement time-weighted interest accrual (compounding) or keep simple linear interest? Simple linear / Compounding over time
2. What should the base interest rate and slope parameters be? (e.g., base 2%, slope 10%) Custom values / Use industry standard (Aave-like: base 0%, slope 4% until 80% util, then 60%)
3. Should the frontend support custom token imports (user-added tokens)? YES / NO
4. Do you want gas optimization focus (e.g., packed structs, unchecked math) or prioritize code readability? Optimize gas / Prioritize readability
5. Should we include a faucet feature for test tokens in the frontend? YES / NO
