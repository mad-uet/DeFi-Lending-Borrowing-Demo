import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { LendingPool, MockERC20, LARToken, InterestRateModel, PriceOracle, MockV3Aggregator } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LendingPool Liquidation", function () {
  // Constants matching contract values
  const LIQUIDATION_BONUS = 500n; // 5% in basis points
  const LIQUIDATION_THRESHOLD = 8000n; // 80% in basis points
  const MAX_LIQUIDATION_CLOSE_FACTOR = 5000n; // 50% of debt can be liquidated at once
  const BASIS_POINTS = 10000n;
  const HEALTH_FACTOR_PRECISION = 10n ** 18n;
  const PRICE_DECIMALS = 8;

  async function deployLendingPoolFixture() {
    const [owner, borrower, liquidator, user3] = await ethers.getSigners();

    // Deploy LAR Token
    const LARToken = await ethers.getContractFactory("LARToken");
    const larToken = await LARToken.deploy();
    await larToken.waitForDeployment();

    // Deploy Interest Rate Model
    const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
    const interestRateModel = await InterestRateModel.deploy();
    await interestRateModel.waitForDeployment();

    // Deploy Price Oracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracle.deploy();
    await priceOracle.waitForDeployment();

    // Deploy Mock Price Feeds
    const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
    const wethPriceFeed = await MockV3AggregatorFactory.deploy(PRICE_DECIMALS, 2000_00000000); // $2000
    const daiPriceFeed = await MockV3AggregatorFactory.deploy(PRICE_DECIMALS, 1_00000000); // $1
    await wethPriceFeed.waitForDeployment();
    await daiPriceFeed.waitForDeployment();

    // Deploy LendingPool
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPool.deploy(
      await larToken.getAddress(),
      await interestRateModel.getAddress(),
      await priceOracle.getAddress()
    );
    await lendingPool.waitForDeployment();

    // Transfer LAR minting rights to LendingPool
    await larToken.transferOwnership(await lendingPool.getAddress());

    // Deploy Mock Tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const weth = await MockERC20.deploy("Wrapped Ether", "WETH", 18);
    const dai = await MockERC20.deploy("Dai Stablecoin", "DAI", 18);
    await weth.waitForDeployment();
    await dai.waitForDeployment();

    // Setup price feeds in oracle
    await priceOracle.setPriceFeed(await weth.getAddress(), await wethPriceFeed.getAddress());
    await priceOracle.setPriceFeed(await dai.getAddress(), await daiPriceFeed.getAddress());

    // Add tokens to lending pool with LTV (WETH: 75%, DAI: 80%)
    await lendingPool.addToken(await weth.getAddress(), 7500);
    await lendingPool.addToken(await dai.getAddress(), 8000);

    // Mint tokens to users
    const initialWeth = ethers.parseUnits("100", 18);
    const initialDai = ethers.parseUnits("100000", 18);
    
    // Borrower gets WETH for collateral
    await weth.mint(borrower.address, initialWeth);
    // Liquidator gets DAI to repay debt
    await dai.mint(liquidator.address, initialDai);
    // Also give borrower some DAI for repayment tests
    await dai.mint(borrower.address, initialDai);
    // User3 provides DAI liquidity
    await dai.mint(user3.address, initialDai);

    return {
      lendingPool,
      larToken,
      interestRateModel,
      priceOracle,
      wethPriceFeed,
      daiPriceFeed,
      weth,
      dai,
      owner,
      borrower,
      liquidator,
      user3,
    };
  }

  async function setupBorrowPosition() {
    const fixture = await loadFixture(deployLendingPoolFixture);
    const { lendingPool, weth, dai, borrower, liquidator, user3 } = fixture;

    // User3 provides DAI liquidity for borrowing
    const daiLiquidity = ethers.parseUnits("50000", 18);
    await dai.connect(user3).approve(await lendingPool.getAddress(), daiLiquidity);
    await lendingPool.connect(user3).deposit(await dai.getAddress(), daiLiquidity);

    // Borrower deposits 10 WETH as collateral ($20,000)
    const collateralAmount = ethers.parseUnits("10", 18);
    await weth.connect(borrower).approve(await lendingPool.getAddress(), collateralAmount);
    await lendingPool.connect(borrower).deposit(await weth.getAddress(), collateralAmount);

    // Borrower borrows 12,000 DAI (60% of collateral value)
    // Max borrow = $20,000 * 75% LTV = $15,000
    // Borrowing $12,000 leaves room before liquidation
    const borrowAmount = ethers.parseUnits("12000", 18);
    await lendingPool.connect(borrower).borrow(await dai.getAddress(), borrowAmount);

    // Liquidator approves DAI spending for liquidation
    await dai.connect(liquidator).approve(await lendingPool.getAddress(), ethers.parseUnits("50000", 18));

    return { ...fixture, collateralAmount, borrowAmount };
  }

  describe("Liquidation Eligibility", function () {
    it("should NOT allow liquidation when health factor > 1", async function () {
      const { lendingPool, weth, dai, borrower, liquidator } = await loadFixture(setupBorrowPosition);

      // Health factor should be > 1.0 initially
      const healthFactor = await lendingPool.calculateHealthFactor(borrower.address);
      expect(healthFactor).to.be.greaterThan(HEALTH_FACTOR_PRECISION);

      // Try to liquidate - should fail
      const liquidationAmount = ethers.parseUnits("1000", 18);
      await expect(
        lendingPool.connect(liquidator).liquidate(
          borrower.address,
          await dai.getAddress(),
          liquidationAmount,
          await weth.getAddress()
        )
      ).to.be.revertedWith("Health factor is healthy");
    });

    it("should allow liquidation when health factor < 1", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator } = await loadFixture(setupBorrowPosition);

      // Drop WETH price to make position unhealthy
      // Current: 10 WETH @ $2000 = $20,000 collateral, $12,000 debt
      // Health factor = ($20,000 * 0.75) / $12,000 = 1.25
      // Need price where HF < 1.0
      // If price = $1200: ($12,000 * 0.75) / $12,000 = 0.75 < 1.0
      await wethPriceFeed.updateAnswer(1200_00000000); // $1200

      // Verify health factor is now < 1.0
      const healthFactor = await lendingPool.calculateHealthFactor(borrower.address);
      expect(healthFactor).to.be.lessThan(HEALTH_FACTOR_PRECISION);

      // Liquidation should succeed
      const liquidationAmount = ethers.parseUnits("5000", 18); // Repay part of debt
      await expect(
        lendingPool.connect(liquidator).liquidate(
          borrower.address,
          await dai.getAddress(),
          liquidationAmount,
          await weth.getAddress()
        )
      ).to.emit(lendingPool, "Liquidation");
    });
  });

  describe("Liquidation Mechanics", function () {
    it("should correctly calculate collateral to seize with bonus", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator } = await loadFixture(setupBorrowPosition);

      // Drop WETH price to $1200 (makes position liquidatable)
      await wethPriceFeed.updateAnswer(1200_00000000);

      // Get liquidator's balances before
      const liquidatorDaiBefore = await dai.balanceOf(liquidator.address);
      const liquidatorWethBefore = await weth.balanceOf(liquidator.address);
      
      // Liquidate $6000 of debt (50% of $12,000 debt - max allowed)
      const debtToRepay = ethers.parseUnits("6000", 18);
      
      await lendingPool.connect(liquidator).liquidate(
        borrower.address,
        await dai.getAddress(),
        debtToRepay,
        await weth.getAddress()
      );

      // Calculate expected collateral: 
      // $6,000 debt / $1,200 per WETH = 5 WETH base
      // Plus 5% bonus: 5 * 1.05 = 5.25 WETH
      const expectedCollateral = ethers.parseUnits("5.25", 18);

      // Check liquidator received collateral with bonus
      const liquidatorWethAfter = await weth.balanceOf(liquidator.address);
      expect(liquidatorWethAfter - liquidatorWethBefore).to.equal(expectedCollateral);

      // Check liquidator paid the debt
      const liquidatorDaiAfter = await dai.balanceOf(liquidator.address);
      expect(liquidatorDaiBefore - liquidatorDaiAfter).to.equal(debtToRepay);
    });

    it("should reduce borrower debt and collateral", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator, borrowAmount, collateralAmount } = await loadFixture(setupBorrowPosition);

      // Make position liquidatable
      await wethPriceFeed.updateAnswer(1200_00000000);

      const borrowerDebtBefore = await lendingPool.getUserBorrow(borrower.address, await dai.getAddress());
      const borrowerCollateralBefore = await lendingPool.getUserDeposit(borrower.address, await weth.getAddress());

      // Liquidate half the debt
      const debtToRepay = ethers.parseUnits("6000", 18);
      await lendingPool.connect(liquidator).liquidate(
        borrower.address,
        await dai.getAddress(),
        debtToRepay,
        await weth.getAddress()
      );

      // Check borrower's debt reduced
      const borrowerDebtAfter = await lendingPool.getUserBorrow(borrower.address, await dai.getAddress());
      expect(borrowerDebtBefore - borrowerDebtAfter).to.equal(debtToRepay);

      // Check borrower's collateral reduced (5.25 WETH seized)
      const borrowerCollateralAfter = await lendingPool.getUserDeposit(borrower.address, await weth.getAddress());
      const expectedCollateralSeized = ethers.parseUnits("5.25", 18);
      expect(borrowerCollateralBefore - borrowerCollateralAfter).to.equal(expectedCollateralSeized);
    });

    it("should emit Liquidation event with correct values", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator } = await loadFixture(setupBorrowPosition);

      await wethPriceFeed.updateAnswer(1200_00000000);

      const debtToRepay = ethers.parseUnits("6000", 18);
      const expectedCollateral = ethers.parseUnits("5.25", 18);
      const expectedBonus = ethers.parseUnits("0.25", 18); // 5% of 5 WETH

      await expect(
        lendingPool.connect(liquidator).liquidate(
          borrower.address,
          await dai.getAddress(),
          debtToRepay,
          await weth.getAddress()
        )
      )
        .to.emit(lendingPool, "Liquidation")
        .withArgs(
          borrower.address,
          liquidator.address,
          await dai.getAddress(),
          debtToRepay,
          await weth.getAddress(),
          expectedCollateral,
          expectedBonus
        );
    });
  });

  describe("Partial Liquidation (Close Factor)", function () {
    it("should limit liquidation to 50% of debt", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator, borrowAmount } = await loadFixture(setupBorrowPosition);

      await wethPriceFeed.updateAnswer(1200_00000000);

      // Try to liquidate 80% of debt (should be capped to 50%)
      const excessiveAmount = (borrowAmount * 80n) / 100n; // 80%
      const maxAllowed = (borrowAmount * 50n) / 100n; // 50%

      await expect(
        lendingPool.connect(liquidator).liquidate(
          borrower.address,
          await dai.getAddress(),
          excessiveAmount,
          await weth.getAddress()
        )
      ).to.be.revertedWith("Exceeds max liquidation amount");
    });

    it("should allow exact 50% debt liquidation", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator, borrowAmount } = await loadFixture(setupBorrowPosition);

      await wethPriceFeed.updateAnswer(1200_00000000);

      const maxLiquidation = (borrowAmount * 50n) / 100n; // Exactly 50%

      await expect(
        lendingPool.connect(liquidator).liquidate(
          borrower.address,
          await dai.getAddress(),
          maxLiquidation,
          await weth.getAddress()
        )
      ).to.emit(lendingPool, "Liquidation");
    });
  });

  describe("Edge Cases", function () {
    it("should not allow self-liquidation", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower } = await loadFixture(setupBorrowPosition);

      await wethPriceFeed.updateAnswer(1200_00000000);
      await dai.connect(borrower).approve(await lendingPool.getAddress(), ethers.parseUnits("10000", 18));

      await expect(
        lendingPool.connect(borrower).liquidate(
          borrower.address,
          await dai.getAddress(),
          ethers.parseUnits("1000", 18),
          await weth.getAddress()
        )
      ).to.be.revertedWith("Cannot liquidate yourself");
    });

    it("should fail if borrower has no debt in the specified token", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator, user3 } = await loadFixture(setupBorrowPosition);

      await wethPriceFeed.updateAnswer(1200_00000000);

      // User3 has no debt, try to liquidate
      await expect(
        lendingPool.connect(liquidator).liquidate(
          user3.address,
          await dai.getAddress(),
          ethers.parseUnits("1000", 18),
          await weth.getAddress()
        )
      ).to.be.revertedWith("No debt to liquidate");
    });

    it("should fail if borrower has no collateral in the specified token", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator } = await loadFixture(setupBorrowPosition);

      await wethPriceFeed.updateAnswer(1200_00000000);

      // Try to seize DAI collateral (borrower has none)
      await expect(
        lendingPool.connect(liquidator).liquidate(
          borrower.address,
          await dai.getAddress(),
          ethers.parseUnits("1000", 18),
          await dai.getAddress() // Wrong collateral token
        )
      ).to.be.revertedWith("Borrower has no collateral in this token");
    });

    it("should handle case where collateral is less than liquidation amount", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator } = await loadFixture(setupBorrowPosition);

      // Set WETH price very low so debt exceeds collateral value
      await wethPriceFeed.updateAnswer(500_00000000); // $500

      // Borrower has 10 WETH @ $500 = $5000 collateral
      // Borrower owes $12,000 debt
      // Even with 50% close factor, $6000 > $5000 collateral value
      
      const debtToRepay = ethers.parseUnits("6000", 18);
      
      // Should only seize available collateral, not more
      await expect(
        lendingPool.connect(liquidator).liquidate(
          borrower.address,
          await dai.getAddress(),
          debtToRepay,
          await weth.getAddress()
        )
      ).to.be.revertedWith("Insufficient collateral to seize");
    });
  });

  describe("Liquidator Profit Calculation", function () {
    it("should provide 5% profit to liquidator", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator } = await loadFixture(setupBorrowPosition);

      await wethPriceFeed.updateAnswer(1200_00000000);

      const liquidatorWethBefore = await weth.balanceOf(liquidator.address);
      const debtToRepay = ethers.parseUnits("1200", 18); // Exactly 1 WETH worth of debt

      await lendingPool.connect(liquidator).liquidate(
        borrower.address,
        await dai.getAddress(),
        debtToRepay,
        await weth.getAddress()
      );

      const liquidatorWethAfter = await weth.balanceOf(liquidator.address);
      const wethReceived = liquidatorWethAfter - liquidatorWethBefore;

      // 1 WETH base + 5% bonus = 1.05 WETH
      const expectedWeth = ethers.parseUnits("1.05", 18);
      expect(wethReceived).to.equal(expectedWeth);

      // Profit in USD terms:
      // Paid: $1,200 (DAI)
      // Received: 1.05 WETH @ $1,200 = $1,260
      // Profit: $60 (5%)
    });
  });

  describe("Health Factor After Liquidation", function () {
    it("should improve or maintain borrower health factor after liquidation", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator } = await loadFixture(setupBorrowPosition);

      // Use a price where liquidation clearly improves health factor
      // At $1400 WETH: 10 WETH = $14,000 collateral, $12,000 debt
      // HF = ($14,000 * 0.75) / $12,000 = 0.875 < 1.0 (liquidatable)
      await wethPriceFeed.updateAnswer(1400_00000000);

      const healthFactorBefore = await lendingPool.calculateHealthFactor(borrower.address);
      expect(healthFactorBefore).to.be.lessThan(HEALTH_FACTOR_PRECISION);

      // Liquidate a smaller portion to allow HF to improve
      // Repay $4,000 of debt (about 1/3)
      await lendingPool.connect(liquidator).liquidate(
        borrower.address,
        await dai.getAddress(),
        ethers.parseUnits("4000", 18),
        await weth.getAddress()
      );

      const healthFactorAfter = await lendingPool.calculateHealthFactor(borrower.address);
      
      // After liquidation:
      // Debt reduced from $12,000 to $8,000
      // Collateral: $4,000 / $1,400 * 1.05 = ~3 WETH seized
      // Remaining: ~7 WETH = $9,800
      // New HF = ($9,800 * 0.75) / $8,000 = 0.92 (improved from 0.875)
      
      // Health factor should improve after partial liquidation
      expect(healthFactorAfter).to.be.greaterThan(healthFactorBefore);
    });

    it("should bring health factor closer to safe when sufficiently liquidated", async function () {
      const { lendingPool, wethPriceFeed, weth, dai, borrower, liquidator } = await loadFixture(setupBorrowPosition);

      // At $1500 WETH: 10 WETH = $15,000 collateral, $12,000 debt
      // HF = ($15,000 * 0.75) / $12,000 = 0.9375 < 1.0 (liquidatable)
      await wethPriceFeed.updateAnswer(1500_00000000);

      // Liquidate max (50% of debt = $6,000)
      await lendingPool.connect(liquidator).liquidate(
        borrower.address,
        await dai.getAddress(),
        ethers.parseUnits("6000", 18),
        await weth.getAddress()
      );

      const healthFactorAfter = await lendingPool.calculateHealthFactor(borrower.address);
      
      // After liquidation:
      // Debt: $12,000 - $6,000 = $6,000
      // Collateral seized: $6,000 / $1,500 * 1.05 = 4.2 WETH
      // Remaining: 10 - 4.2 = 5.8 WETH = $8,700
      // New HF = ($8,700 * 0.75) / $6,000 = 1.0875 > 1.0 (back to safety!)
      
      expect(healthFactorAfter).to.be.greaterThan(HEALTH_FACTOR_PRECISION);
    });
  });
});
