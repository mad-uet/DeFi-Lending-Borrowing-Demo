## Plan: Diagnostic Status Page for DeFi Frontend

Create a dedicated `/status` page that provides real-time diagnostic information about all communication layers between the frontend, MetaMask, and smart contracts. This will help identify exactly where failures occur in the chain: MetaMask connection → Provider → Network → Contract addresses → Contract calls.

**Phases (5 phases)**

1. **Phase 1: Core Diagnostic Hook**
   - **Objective:** Create a `useDiagnostics` hook that tests each communication layer and collects detailed status information
   - **Files/Functions to Create:** [frontend/src/hooks/useDiagnostics.ts](../frontend/src/hooks/useDiagnostics.ts)
   - **Tests to Write:** Manual testing via status page (this is a diagnostic tool)
   - **Steps:**
     1. Create hook that checks MetaMask availability and version
     2. Test provider connection and network details
     3. Verify chain ID matches expected (31337)
     4. Test RPC connectivity to hardhat node
     5. Validate all contract addresses from env vars
     6. Test basic contract calls (getSupportedTokensCount, etc.)
     7. Return structured diagnostic results with pass/fail status

2. **Phase 2: Status Page UI Component**
   - **Objective:** Create the `/status` page with clear visual indicators for each diagnostic check
   - **Files/Functions to Create:** [frontend/src/app/status/page.tsx](../frontend/src/app/status/page.tsx)
   - **Tests to Write:** Visual testing of component rendering
   - **Steps:**
     1. Create status page with header and navigation back to main app
     2. Add diagnostic cards for each layer (MetaMask, Network, Contracts)
     3. Display color-coded status (green=pass, red=fail, yellow=warning)
     4. Show detailed error messages and suggestions for fixes
     5. Add "Run Diagnostics" button to re-run all checks
     6. Display raw data/logs for advanced debugging

3. **Phase 3: Contract Verification Section**
   - **Objective:** Add detailed contract-by-contract testing to verify each contract is deployed and responding
   - **Files/Functions to Modify:** [frontend/src/app/status/page.tsx](../frontend/src/app/status/page.tsx), [frontend/src/hooks/useDiagnostics.ts](../frontend/src/hooks/useDiagnostics.ts)
   - **Tests to Write:** Contract call verification tests
   - **Steps:**
     1. Test LendingPool contract - call `getSupportedTokensCount()`
     2. Test each token contract (WETH, DAI, USDC, LINK) - call `symbol()`, `decimals()`
     3. Test PriceOracle contract - call `getPrice()` for each token
     4. Test LARToken contract - call `totalSupply()`
     5. Display deployed vs expected addresses
     6. Show bytecode existence check results

4. **Phase 4: Environment & Configuration Display**
   - **Objective:** Display all environment variables and configuration to help spot misconfigurations
   - **Files/Functions to Modify:** [frontend/src/app/status/page.tsx](../frontend/src/app/status/page.tsx)
   - **Tests to Write:** Env var display tests
   - **Steps:**
     1. Display all NEXT_PUBLIC env variables and their values
     2. Compare deployed addresses (from localhost.json) vs configured addresses
     3. Show chain ID configuration
     4. Display RPC URL being used
     5. Add copy-to-clipboard for addresses

5. **Phase 5: Real-time Log Console**
   - **Objective:** Add a live console that captures and displays all Web3 calls and responses
   - **Files/Functions to Create:** [frontend/src/hooks/useDebugLogger.ts](../frontend/src/hooks/useDebugLogger.ts)
   - **Files/Functions to Modify:** [frontend/src/app/status/page.tsx](../frontend/src/app/status/page.tsx)
   - **Tests to Write:** Logger functionality tests
   - **Steps:**
     1. Create debug logger hook that captures diagnostic events
     2. Add log entry types: INFO, SUCCESS, ERROR, WARNING
     3. Display timestamped log entries in console section
     4. Add filter/search functionality for logs
     5. Add export logs as JSON feature

**Open Questions:**

1. Should the status page be accessible without wallet connection, or require connection first? Recommendation: Accessible without connection / Require connection first
2. Should we add auto-retry functionality for failed checks? Yes with configurable interval / No, manual only
