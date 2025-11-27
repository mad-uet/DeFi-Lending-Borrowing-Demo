# Plan: Frontend Polish, Educational UX & Transaction Previews

This plan enhances the DeFi Lending & Borrowing frontend with comprehensive transaction previews (especially for liquidation scenarios), educational visual demonstrations following "show, don't tell" principles, and polished UI with dynamic animations and notifications.

**Phases (7 phases)**

## Phase 1: Notification & Toast System Enhancement

**Objective:** Create a robust, animated notification system that tracks transaction states and protocol events (like liquidation)

**Files/Functions to Modify/Create:**
- Create `frontend/src/components/ui/NotificationCenter.tsx` - Persistent notification panel
- Create `frontend/src/components/ui/AnimatedToast.tsx` - Enhanced toast with animations
- Create `frontend/src/hooks/useNotifications.ts` - Notification state management
- Modify `frontend/src/app/layout.tsx` - Integrate notification center

**Tests to Write:**
- `NotificationCenter.test.tsx` - Test notification display and dismissal
- `useNotifications.test.ts` - Test notification state management

**Steps:**
1. Create notification types and state management hook with persistence
2. Build AnimatedToast component with slide-in/fade-out animations and icons
3. Create NotificationCenter component with history and categorization
4. Integrate with layout and existing toast system
5. Test notification flow and animations

---

## Phase 2: Transaction Preview System

**Objective:** Implement a comprehensive transaction preview that shows before/after states, especially for borrow actions that affect health factor

**Files/Functions to Modify/Create:**
- Create `frontend/src/components/ui/TransactionPreview.tsx` - Main preview component
- Create `frontend/src/components/ui/HealthFactorGauge.tsx` - Visual gauge component
- Create `frontend/src/components/ui/BalanceChangePreview.tsx` - Before/after balance display
- Modify `frontend/src/components/modals/ModalBorrow.tsx` - Integrate preview
- Modify `frontend/src/components/modals/ModalSupply.tsx` - Integrate preview
- Modify `frontend/src/components/modals/ModalWithdraw.tsx` - Integrate preview
- Modify `frontend/src/components/modals/ModalRepay.tsx` - Integrate preview

**Tests to Write:**
- `TransactionPreview.test.tsx` - Test preview calculations
- `HealthFactorGauge.test.tsx` - Test gauge rendering

**Steps:**
1. Create HealthFactorGauge component with animated arc/circle visualization
2. Build BalanceChangePreview showing wallet/pool changes with arrows
3. Create TransactionPreview wrapper with before/after comparison
4. Add liquidation risk warning with visual indicator when health factor < 1.2
5. Integrate previews into all modals with "What will happen" sections
6. Test preview accuracy against contract calculations

---

## Phase 3: Liquidation Alert & Event Tracking

**Objective:** Create real-time monitoring for liquidation risk and display alerts when positions are at risk or when liquidation occurs

**Files/Functions to Modify/Create:**
- Create `frontend/src/components/LiquidationWarning.tsx` - Prominent warning banner
- Create `frontend/src/hooks/useLiquidationMonitor.ts` - Monitor health factor changes
- Create `frontend/src/hooks/useTransactionHistory.ts` - Track user transactions
- Create `frontend/src/components/TransactionHistory.tsx` - Display past transactions
- Modify `frontend/src/components/HealthFactor.tsx` - Add trend indicator and alerts

**Tests to Write:**
- `useLiquidationMonitor.test.ts` - Test threshold detection
- `LiquidationWarning.test.tsx` - Test warning display conditions

**Steps:**
1. Create useLiquidationMonitor hook to track health factor trends
2. Build LiquidationWarning component with animated danger styling
3. Create transaction history hook to track deposits/borrows/liquidations
4. Build TransactionHistory component with timeline visualization
5. Enhance HealthFactor with trend arrows and animated alerts
6. Test liquidation detection and warning display

---

## Phase 4: Educational Mode & Visual Demonstrations

**Objective:** Add an educational overlay mode that explains DeFi concepts visually during user interactions

**Files/Functions to Modify/Create:**
- Create `frontend/src/components/education/EducationalOverlay.tsx` - Explanation tooltips
- Create `frontend/src/components/education/ConceptCard.tsx` - Educational info cards
- Create `frontend/src/components/education/FlowDiagram.tsx` - Visual flow explanations
- Create `frontend/src/components/education/InteractiveDemo.tsx` - Step-by-step walkthrough
- Create `frontend/src/hooks/useEducationalMode.ts` - Toggle and state management
- Create `frontend/src/data/educationalContent.ts` - Content for explanations
- Modify `frontend/src/app/page.tsx` - Add education toggle button

**Tests to Write:**
- `EducationalOverlay.test.tsx` - Test overlay display
- `useEducationalMode.test.ts` - Test mode toggling

**Steps:**
1. Create educational content data with explanations for each concept
2. Build ConceptCard component with animated info displays
3. Create FlowDiagram showing token flows (deposit → collateral → borrow → repay)
4. Build EducationalOverlay with context-aware tooltips
5. Create InteractiveDemo with guided walkthrough for teachers
6. Add persistent educational mode toggle in header
7. Test educational mode activation and content display

---

## Phase 5: Animated UI Components & Visual Polish

**Objective:** Add smooth animations, micro-interactions, and vibrant visuals throughout the UI

**Files/Functions to Modify/Create:**
- Create `frontend/src/components/ui/AnimatedNumber.tsx` - Counter animations
- Create `frontend/src/components/ui/PulsingDot.tsx` - Status indicators
- Create `frontend/src/components/ui/SkeletonLoader.tsx` - Improved loading states
- Create `frontend/src/components/ui/TokenIcon.tsx` - Colorful token avatars with animation
- Modify `frontend/src/app/globals.css` - Add keyframe animations
- Modify `frontend/tailwind.config.ts` - Extend animation utilities
- Modify all table/card components for hover effects and transitions

**Tests to Write:**
- `AnimatedNumber.test.tsx` - Test number transitions
- Visual regression tests for animations

**Steps:**
1. Define CSS keyframes for slide, fade, pulse, and glow animations
2. Extend Tailwind config with custom animation utilities
3. Create AnimatedNumber component for smooth value transitions
4. Build PulsingDot for live status indication
5. Create vibrant TokenIcon with gradient backgrounds and hover effects
6. Update all cards with subtle hover animations and shadows
7. Add loading skeletons with shimmer effect
8. Test animations render correctly

---

## Phase 6: Action Confirmation & Progress Indicators

**Objective:** Replace basic transaction toasts with visual step-by-step progress indicators

**Files/Functions to Modify/Create:**
- Create `frontend/src/components/ui/TransactionProgress.tsx` - Multi-step progress
- Create `frontend/src/components/ui/ConfirmationDialog.tsx` - Enhanced confirmation modal
- Create `frontend/src/components/ui/StepIndicator.tsx` - Visual step component
- Modify all modal transaction handlers to use new progress system

**Tests to Write:**
- `TransactionProgress.test.tsx` - Test step progression
- `ConfirmationDialog.test.tsx` - Test confirmation flow

**Steps:**
1. Create StepIndicator component with animated checkmarks
2. Build TransactionProgress showing: Approve → Confirm → Execute → Complete
3. Create ConfirmationDialog with summary and "I understand the risks" checkbox for risky actions
4. Integrate progress indicators into supply/borrow/withdraw/repay flows
5. Add cancel ability during approval phase
6. Test complete transaction flows with progress display

---

## Phase 7: Dashboard Enhancements & Final Polish

**Objective:** Polish the main dashboard with summary cards, quick stats, and final UI refinements

**Files/Functions to Modify/Create:**
- Create `frontend/src/components/DashboardStats.tsx` - Overview statistics
- Create `frontend/src/components/QuickActions.tsx` - Common action shortcuts
- Create `frontend/src/components/PositionSummary.tsx` - User position overview
- Modify `frontend/src/app/page.tsx` - Integrate new components
- Modify `frontend/src/components/WalletConnect.tsx` - Add connection animations

**Tests to Write:**
- `DashboardStats.test.tsx` - Test stat calculations
- `PositionSummary.test.tsx` - Test position display

**Steps:**
1. Create DashboardStats with animated stat cards (Total Supplied, Total Borrowed, Net APY)
2. Build QuickActions for one-click common operations
3. Create PositionSummary with visual pie/bar charts
4. Enhance WalletConnect with connection animation and status
5. Final CSS polish for consistent spacing and colors
6. Cross-browser testing and responsive design verification

---

## Design Decisions (Confirmed)

1. ✅ **Educational mode**: Visual/text explanations only (no audio)
2. ✅ **Transaction previews**: Show gas estimates for educational value
3. ✅ **Notification history**: Session only (no localStorage persistence)
4. ✅ **Health factor polling**: Every 5 seconds (current rate)
5. ✅ **Sandbox mode**: Include transaction simulation feature for safe learning

---

## Phase 8: Sandbox Simulation Mode

**Objective:** Add a simulation mode where users can preview transaction outcomes without executing on-chain

**Files/Functions to Modify/Create:**

- Create `frontend/src/components/sandbox/SimulationPanel.tsx` - Simulation controls
- Create `frontend/src/components/sandbox/SimulatedBalance.tsx` - Mock balance display
- Create `frontend/src/hooks/useSimulation.ts` - Simulation state management
- Create `frontend/src/lib/simulation.ts` - Transaction simulation logic
- Modify `frontend/src/app/page.tsx` - Add simulation mode toggle

**Tests to Write:**

- `useSimulation.test.ts` - Test simulation state
- `simulation.test.ts` - Test calculation accuracy

**Steps:**

1. Create simulation state management with virtual balances
2. Build SimulationPanel with "Start Simulation" toggle
3. Create SimulatedBalance component showing hypothetical states
4. Implement simulation logic mirroring smart contract calculations
5. Add visual distinction between real and simulated mode
6. Allow resetting simulation to current on-chain state
7. Test simulation accuracy against real contract behavior
