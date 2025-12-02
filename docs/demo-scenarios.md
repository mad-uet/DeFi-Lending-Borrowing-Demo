# Demo Scenarios

This document provides step-by-step walkthroughs for demonstrating the DeFi Lending & Borrowing Platform. Each scenario showcases different features and use cases.

## Prerequisites

Before running these scenarios:

1. ✅ Hardhat node running (`npx hardhat node`)
2. ✅ Contracts deployed to localhost
3. ✅ Frontend running (`cd frontend && npm run dev`)
4. ✅ MetaMask connected to localhost:8545
5. ✅ 2-3 test accounts imported into MetaMask

## Scenario 1: Basic Deposit & Withdraw

**Objective**: Demonstrate simple supply and withdrawal flow with LAR rewards

**Time**: ~5 minutes

### Step-by-Step

1. **Connect Wallet**
   - Open `http://localhost:3000`
   - Click "Connect Wallet"
   - Approve MetaMask connection

2. **Get Test Tokens**
   - Navigate to "Faucet" tab
   - Click "Get WETH Tokens"
   - Approve transaction in MetaMask
   - Wait for confirmation (toast notification)
   - Verify: Check wallet balance shows 10 WETH

3. **Supply WETH**
   - Go to "Supply" tab
   - Find WETH in the asset list
   - Click "Supply" button
   - Enter amount: `5` WETH
   - Click "Supply" in modal
   - **First time**: Approve token spending (2 transactions)
   - Confirm supply transaction
   - Wait for confirmation

4. **Verify LAR Rewards**
   - Check "Your Supplies" section
   - Verify: 5 WETH supplied
   - Verify: ~10,000 LAR tokens received (5 WETH × $2,000)
   - Note the APY shown (depends on utilization)

5. **Wait for Interest (Simulated)**
   - In reality, interest accrues every block
   - For demo, wait 10-30 seconds
   - Refresh page to see updated balance

6. **Withdraw Portion**
   - In "Your Supplies", find WETH
   - Click "Withdraw"
   - Enter amount: `2` WETH
   - Confirm transaction
   - Verify: LAR tokens burned proportionally (~4,000 LAR)
   - Verify: WETH balance increased by 2

7. **Check Final State**
   - Your Supplies: 3 WETH remaining
   - LAR Balance: ~6,000 LAR
   - Wallet Balance: 7 WETH (5 initial + 2 withdrawn from 10 faucet)

**Key Takeaways**:
- ✅ LAR tokens minted 1:1 with USD value
- ✅ LAR tokens burned on withdrawal
- ✅ Can withdraw anytime (if no borrows against it)

---

## Scenario 2: Borrowing Flow

**Objective**: Demonstrate over-collateralized borrowing with health factor monitoring

**Time**: ~7 minutes

### Step-by-Step

1. **Setup Collateral**
   - Use Faucet to get 10 WETH and 5,000 DAI
   - Supply 10 WETH as collateral
   - Verify: 10 WETH supplied, ~20,000 LAR received
   - Note: Health Factor shows "∞" (no debt yet)

2. **Calculate Maximum Borrow**
   - Collateral: 10 WETH @ $2,000 = $20,000
   - LTV for WETH: 75%
   - **Maximum borrowing power**: $20,000 × 0.75 = $15,000
   - Can borrow up to 15,000 DAI (or equivalent in other tokens)

3. **Borrow DAI**
   - Go to "Borrow" tab
   - Find DAI in the asset list
   - Click "Borrow"
   - Enter amount: `10000` DAI (conservative, ~67% of max)
   - Confirm transaction
   - Verify: 10,000 DAI received in wallet

4. **Check Health Factor**
   - Navigate to Health Factor widget at top
   - Expected calculation:
     ```
     Collateral: $20,000 × 0.80 (liquidation threshold) = $16,000
     Debt: $10,000
     Health Factor = $16,000 / $10,000 = 1.6
     ```
   - Status: **Safe** (green) - plenty of cushion

5. **Simulate Price Movement**
   - *Note: In production, price changes are external*
   - For demo, imagine WETH price drops to $1,600
   - New calculation:
     ```
     Collateral: $16,000 × 0.80 = $12,800
     Debt: $10,000
     Health Factor = $12,800 / $10,000 = 1.28
     ```
   - Status: **Warning** (yellow) - approaching risk

6. **Partial Repayment**
   - Go to "Your Borrows" section
   - Find DAI borrow
   - Click "Repay"
   - Enter amount: `5000` DAI
   - Approve DAI spending (first time)
   - Confirm repay transaction
   - Verify: Borrowed amount reduced to 5,000 DAI

7. **Check Improved Health Factor**
   - Health Factor improves:
     ```
     Collateral: $20,000 × 0.80 = $16,000
     Debt: $5,000
     Health Factor = $16,000 / $5,000 = 3.2
     ```
   - Status: **Safe** (green) - much safer now

8. **Full Repayment & Withdraw**
   - Repay remaining 5,000 DAI
   - Health Factor returns to ∞ (no debt)
   - Now can withdraw full 10 WETH collateral
   - Withdraw all WETH
   - LAR tokens fully burned

**Key Takeaways**:
- ✅ Must maintain collateral > debt
- ✅ Health factor must stay > 1.0
- ✅ Can repay anytime to improve health factor
- ✅ Different tokens have different LTV ratios

---

## Scenario 3: Multi-Collateral & Interest Accrual

**Objective**: Demonstrate borrowing against diversified collateral with dynamic interest rates

**Time**: ~10 minutes

### Step-by-Step

1. **Acquire Diverse Assets**
   - Use Faucet to get all 4 tokens:
     - 10 WETH
     - 10,000 DAI
     - 10,000 USDC
     - 100 LINK
   - Verify balances in wallet

2. **Supply Mixed Collateral**
   - Supply 2 WETH
   - Supply 3,000 DAI
   - Supply 2,000 USDC
   - Wait for all transactions to confirm

3. **Calculate Total Borrowing Power**
   - WETH: 2 × $2,000 × 0.75 = $3,000
   - DAI: 3,000 × $1 × 0.80 = $2,400
   - USDC: 2,000 × $1 × 0.80 = $1,600
   - **Total borrowing power**: $7,000

4. **Attempt to Borrow LINK**
   - LINK price: $15
   - Maximum LINK: $7,000 / $15 = ~466 LINK
   - Try to borrow 500 LINK
   - Expected: **Transaction fails** (exceeds borrowing power)
   - Adjust to 400 LINK
   - Transaction succeeds

5. **Monitor Borrow APY**
   - Check LINK borrow APY before transaction
   - After borrowing, APY may increase (higher utilization)
   - Example:
     - Before: 50% utilization → 6% APY
     - After: 70% utilization → 8% APY

6. **Check Supply APY**
   - Your WETH/DAI/USDC supply now earns higher APY
   - Supply APY = Borrow APY × Utilization
   - Example:
     - LINK pool: 70% util × 8% borrow = 5.6% supply APY

7. **Simulate Time Passing**
   - In production, interest accrues per block
   - For demo, wait 1-2 minutes
   - Refresh data
   - Check "Amount Owed" in "Your Borrows"
   - Should be slightly higher than borrowed amount

8. **Repay with Interest**
   - Try to repay exact borrowed amount (400 LINK)
   - Expected: **Transaction fails** (must repay with interest)
   - Check exact amount owed (e.g., 400.05 LINK)
   - Use Max button to repay full amount
   - Transaction succeeds

9. **Withdraw All Collateral**
   - Health Factor back to ∞
   - Withdraw all supplied assets:
     - 2 WETH
     - 3,000 DAI
     - 2,000 USDC
   - All LAR tokens burned

**Key Takeaways**:
- ✅ Can use multiple token types as collateral
- ✅ Each token contributes to total borrowing power based on its LTV
- ✅ Interest rates are dynamic based on utilization
- ✅ Must repay borrowed amount + accrued interest

---

## Scenario 4: Multi-User Interaction

**Objective**: Demonstrate how multiple users interact with shared liquidity pools

**Time**: ~15 minutes

**Prerequisites**: Import 3 different test accounts into MetaMask

### Step-by-Step

**User A (Lender)**:

1. Switch to Account A in MetaMask
2. Get 10 WETH from faucet
3. Supply all 10 WETH
4. Note: Receives ~20,000 LAR
5. Check WETH supply APY (initially low, no borrows)

**User B (Borrower)**:

1. Switch to Account B in MetaMask
2. Get 10,000 DAI from faucet
3. Supply 10,000 DAI as collateral
4. Borrow 5 WETH from the pool
5. Note: User A's supply now being utilized
6. Check WETH borrow APY (e.g., 6% at 50% utilization)

**User A (Check Earnings)**:

1. Switch back to Account A
2. Refresh page
3. Check WETH supply APY - should be higher now!
   - Before: 0% APY (no utilization)
   - After: ~3% APY (50% util × 6% borrow rate)
4. Wait 30 seconds
5. Check "Amount Supplied" - should increase slightly (interest)

**User C (Additional Lender)**:

1. Switch to Account C
2. Get 10,000 USDC from faucet
3. Supply all 10,000 USDC
4. Note: Also earns LAR (~10,000 LAR for $10,000 USDC)
5. Check USDC supply APY (low, no borrows yet)

**User B (Additional Borrow)**:

1. Switch back to Account B
2. Borrow 5,000 USDC
3. Check Health Factor (should still be safe)
4. Note: User C now earns APY on their USDC

**User A (Withdraw)**:

1. Switch to Account A
2. Try to withdraw all 10 WETH
3. Expected: **Transaction fails** (5 WETH borrowed by User B)
4. Can only withdraw 5 WETH (available liquidity)
5. Withdraw 5 WETH successfully
6. 5 WETH remains supplied earning interest

**User B (Repay)**:

1. Switch to Account B
2. Repay all borrowed WETH with interest
3. Health Factor improves significantly

**User A (Final Withdraw)**:

1. Switch back to Account A
2. Now can withdraw remaining 5 WETH (liquidity available)
3. Withdraw all
4. LAR tokens fully burned

**Key Takeaways**:
- ✅ Users share a common liquidity pool
- ✅ Utilization affects interest rates for everyone
- ✅ Can't withdraw borrowed funds (liquidity constraint)
- ✅ Interest accrues in real-time for both lenders and borrowers

---

## Scenario 5: Analytics Dashboard

**Objective**: Demonstrate protocol-wide statistics and market overview

**Time**: ~5 minutes

### Step-by-Step

1. **Setup Initial State**
   - Have User A supply 5 WETH, 5,000 DAI
   - Have User B supply 3,000 USDC, borrow 2 WETH
   - Have User C supply 50 LINK, borrow 1,000 DAI

2. **Navigate to Analytics**
   - Click "Analytics" link in header (or go to `/analytics`)
   - Page loads with protocol statistics

3. **Review Protocol Overview**
   - **Total Value Locked**: Sum of all deposits in USD
     - Example: $16,000 (WETH) + $5,000 (DAI) + $3,000 (USDC) + $750 (LINK) = $24,750
   - **Total Borrowed**: Sum of all borrows in USD
     - Example: $4,000 (WETH) + $1,000 (DAI) = $5,000
   - **Overall Utilization**: $5,000 / $24,750 = 20.2%
   - **LAR in Circulation**: ~24,750 LAR (1:1 with TVL)

4. **Analyze Token Markets Table**
   - Each row shows one token market
   - **WETH Row**:
     - Total Supplied: 5 WETH
     - Total Borrowed: 2 WETH
     - Utilization: 40%
     - Borrow APY: ~5.2% (from interest rate model)
     - Supply APY: ~2.08% (40% × 5.2%)
     - TVL (USD): $10,000
   - Compare different tokens' utilization and rates

5. **Observe Real-Time Updates**
   - Leave page open for 10 seconds
   - Data auto-refreshes
   - In another tab, make a transaction (e.g., borrow more)
   - Watch analytics update after 10 seconds

6. **Compare Market Dynamics**
   - High utilization tokens: Higher APY for both supply and borrow
   - Low utilization tokens: Lower APY, more liquidity available
   - Stablecoins (DAI, USDC): Typically lower rates, higher LTV
   - Volatile assets (LINK): Higher borrow rates, lower LTV

**Key Takeaways**:
- ✅ Analytics show protocol health at a glance
- ✅ Can identify best supply/borrow opportunities
- ✅ Utilization drives interest rate dynamics
- ✅ Real-time updates keep data fresh

---

## Scenario 6: Edge Cases & Error Handling

**Objective**: Demonstrate proper error handling and validation

**Time**: ~10 minutes

### Test Cases

**1. Insufficient Balance**
- Try to supply 100 WETH (only have 10)
- Expected: MetaMask shows "Insufficient funds" error
- UI may also show validation error

**2. Exceeding Borrowing Power**
- Supply 1 WETH ($2,000 × 0.75 = $1,500 borrowing power)
- Try to borrow 2,000 DAI
- Expected: Transaction reverts with "Insufficient collateral"

**3. Health Factor Too Low**
- Have an existing borrow with HF = 1.2
- Try to borrow more
- Expected: Transaction fails if new HF < 1.0
- Error: "Would cause unhealthy position"

**4. Withdraw More Than Deposited**
- Supply 5 WETH
- Try to withdraw 10 WETH
- Expected: Error "Insufficient balance"

**5. Withdraw Collateral in Use**
- Supply 10 WETH
- Borrow 10,000 DAI (HF = 1.6)
- Try to withdraw all 10 WETH
- Expected: Error "Cannot withdraw, collateral in use"
- Can withdraw ~3.75 WETH max (keeps HF ≥ 1.0)

**6. No Token Approval**
- Try to supply DAI without approving first
- Expected: "Approve" button appears
- Click approve, then supply works

**7. Network Disconnection**
- Disconnect MetaMask
- UI shows "Connect Wallet" prompt
- All data hooks pause
- Reconnect to resume

**8. Wrong Network**
- Switch MetaMask to Ethereum Mainnet
- Expected: Error "Please switch to Hardhat Local network"
- Switch back to localhost:8545
- App resumes normal operation

**Key Takeaways**:
- ✅ All edge cases handled gracefully
- ✅ Clear error messages guide users
- ✅ Frontend validation prevents failed transactions
- ✅ Smart contract validation is final line of defense

---

## Presentation Tips

When demonstrating this platform:

1. **Start Simple**: Begin with Scenario 1 (basic deposit/withdraw)
2. **Build Complexity**: Progress to borrowing, then multi-collateral
3. **Highlight Key Concepts**:
   - Pool-based liquidity vs. P2P
   - Over-collateralization necessity
   - Dynamic interest rates
   - Health factor importance
4. **Show Analytics**: Use dashboard to visualize protocol state
5. **Test Edge Cases**: Demonstrate robust error handling
6. **Multiple Accounts**: Use 2-3 accounts to show multi-user dynamics
7. **Time Management**: Each scenario takes 5-15 minutes
8. **Have Backup**: Pre-fund accounts in case faucet is slow

## Troubleshooting Common Demo Issues

**Transactions Pending Forever**:
- Check Hardhat node is still running
- Verify correct network in MetaMask (Chain ID 31337)
- Try resetting account in MetaMask (Settings → Advanced → Reset Account)

**Faucet Not Working**:
- Ensure contracts deployed with faucet function
- Check you're using correct token address
- Verify sufficient faucet supply (may need to redeploy)

**Wrong Balances Showing**:
- Hard refresh page (Ctrl + Shift + R)
- Check SWR cache isn't stale
- Verify contract addresses in `.env.local` are correct

**MetaMask Errors**:
- Ensure using account with sufficient ETH for gas
- Check nonce isn't out of sync (reset account)
- Verify RPC endpoint is correct (http://127.0.0.1:8545)

---

## Scenario 7: Liquidation Flow & Liquidator Bot

**Objective**: Demonstrate how liquidations work, including the liquidator bot simulation

**Time**: ~12 minutes

### Part A: Creating a Liquidatable Position

**User A (Borrower)**:

1. **Setup Initial Position**
   - Connect with Account A
   - Get 2 WETH from faucet ($4,000 value at $2,000/WETH)
   - Supply all 2 WETH as collateral
   - Borrowing power: $4,000 × 0.75 LTV = $3,000
   - Note: Health Factor = ∞ (no debt)

2. **Borrow Near Maximum Capacity**
   - Borrow 2,500 DAI (~83% of borrowing power)
   - Health Factor calculation:
     ```
     Collateral: 2 WETH × $2,000 × 0.80 threshold = $3,200
     Debt: 2,500 DAI = $2,500
     Health Factor = $3,200 / $2,500 = 1.28
     ```
   - Status: **Warning** (yellow) - risky but not liquidatable

3. **Increase Risk (Optional)**
   - Borrow additional 200 DAI (total: 2,700 DAI)
   - New Health Factor = $3,200 / $2,700 = 1.185
   - Status: **High Risk** - very close to liquidation threshold

### Part B: Simulating Price Drop

4. **Using the Price Simulation (if available)**
   - Navigate to Simulation Panel on main dashboard
   - Enable "Simulation Mode"
   - Use price slider to reduce WETH price
   - Drop WETH from $2,000 to $1,500 (-25%)
   - New Health Factor calculation:
     ```
     Collateral: 2 WETH × $1,500 × 0.80 = $2,400
     Debt: $2,700
     Health Factor = $2,400 / $2,700 = 0.889
     ```
   - Status: **🔴 LIQUIDATION ELIGIBLE** - HF < 1.0

5. **Observe Liquidation Warning**
   - Red banner appears: "LIQUIDATION ELIGIBLE"
   - Health factor shows in red
   - Trend indicator shows "worsening"
   - Suggestions to add collateral or repay debt

### Part C: Using the Liquidator Dashboard

**User B (Liquidator)**:

6. **Access Liquidator Dashboard**
   - Open new browser tab/window
   - Connect with Account B (different from borrower)
   - Navigate to `/liquidator` (or click "🤖 Liquidator" in nav)
   - View the Liquidator Dashboard

7. **Start the Liquidator Bot**
   - Click "▶️ Start Bot" button
   - Bot status changes to "● Active"
   - Bot begins scanning for liquidatable positions

8. **View Liquidatable Positions**
   - User A's position appears in "Liquidatable" section (red)
   - Position shows:
     - Health Factor: 0.889
     - Total Debt: $2,700
     - Total Collateral: $3,000
     - Max Liquidation: $1,350 (50% of debt)
     - Potential Profit: ~$67.50 (5% of $1,350)

9. **Configure Auto-Liquidation**
   - Toggle "Auto-Liquidate" ON
   - Adjust liquidation delay slider (e.g., 5 seconds)
   - Bot will automatically execute when countdown completes

10. **Watch Countdown Timer**
    - Yellow banner appears: "⏳ Liquidating..."
    - Countdown shows seconds remaining
    - Progress bar depletes as countdown progresses
    - Target borrower address shown

### Part D: Executing Liquidation

11. **Liquidation Execution**
    - At countdown = 0, transaction is submitted
    - MetaMask popup appears (confirm quickly for auto-flow)
    - Toast notification: "💰 Liquidation Executed!"
    - Details: Debt repaid, collateral seized, bonus earned

12. **View Results**
    - Statistics update:
      - Total Liquidations: 1
      - Total Profit: ~$67.50
      - Debt Repaid: ~$1,350
      - Collateral Seized: ~$1,417.50 (includes 5% bonus)
    - Recent Liquidations list shows the event
    - Click event for detailed breakdown

13. **Check Borrower's Position (User A)**
    - Switch back to Account A tab
    - Health Factor improved:
      ```
      Previous: 0.889 (liquidatable)
      After partial liquidation: ~1.2+ (safer)
      ```
    - Debt reduced by ~50%
    - Collateral reduced proportionally + 5% penalty

### Part E: Manual Liquidation (Alternative)

14. **Manual Liquidation Flow**
    - If auto-liquidate is OFF, positions remain in list
    - Click "Liquidate" button on a position
    - Confirmation modal appears:
      - Shows debt to repay (max 50%)
      - Shows collateral to receive (+ 5%)
      - Shows potential profit
    - Click "Execute Liquidation"
    - Confirm in MetaMask

### Understanding the Numbers

**Liquidation Example Breakdown**:
```
Borrower's Position (before):
- Collateral: 2 WETH @ $1,500 = $3,000
- Debt: 2,700 DAI
- Health Factor: 0.889 (liquidatable)

Liquidation Execution:
- Max Liquidation (50% close factor): 1,350 DAI
- Liquidator repays: 1,350 DAI
- Liquidator receives: $1,350 × 1.05 = $1,417.50 in WETH
- WETH received: $1,417.50 / $1,500 = 0.945 WETH

Borrower's Position (after):
- Collateral: 2 - 0.945 = 1.055 WETH @ $1,500 = $1,582.50
- Debt: 2,700 - 1,350 = 1,350 DAI
- Health Factor: ($1,582.50 × 0.80) / $1,350 = 0.938
  (Still at risk - may need another liquidation)

Liquidator's Profit:
- Paid: $1,350 (DAI)
- Received: $1,417.50 (WETH)
- Net Profit: $67.50 (5% bonus)
```

**Key Takeaways**:
- ✅ Positions become liquidatable when Health Factor < 1.0
- ✅ Liquidators earn 5% bonus on collateral seized
- ✅ Maximum 50% of debt can be liquidated per transaction
- ✅ Multiple liquidations may be needed for severely underwater positions
- ✅ Liquidation improves (or maintains) borrower's health factor
- ✅ Bot can be configured for automatic or manual execution

---

## Next Steps

After completing these scenarios, you can:

1. Explore the codebase to understand implementation
2. Run the test suite (`npx hardhat test`) to see 233+ tests
3. Review [ARCHITECTURE.md](../ARCHITECTURE.md) for technical deep-dive
4. Check [DEPLOYMENT.md](../DEPLOYMENT.md) for production deployment
5. Read [CONTRIBUTING.md](../CONTRIBUTING.md) to add features

Happy demonstrating! 🚀
