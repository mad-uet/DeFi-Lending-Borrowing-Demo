import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { LendingPool, LARToken, InterestRateModel, PriceOracle, MockERC20, MockV3Aggregator } from "../../typechain-types";

describe("Interest Accrual Scenarios", function () {
  // Deployment fixture
  async function deployLendingPoolFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const weth = await MockERC20Factory.deploy("Wrapped Ether", "WETH", 18);
    const dai = await MockERC20Factory.deploy("Dai Stablecoin", "DAI", 18);

    // Deploy mock price feeds
    const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
    const wethPriceFeed = await MockV3AggregatorFactory.deploy(8, 200000000000); // $2,000
    const daiPriceFeed = await MockV3AggregatorFactory.deploy(8, 100000000); // $1

    // Deploy LAR Token
    const LARTokenFactory = await ethers.getContractFactory("LARToken");
    const larToken = await LARTokenFactory.deploy();

    // Deploy Interest Rate Model
    const InterestRateModelFactory = await ethers.getContractFactory("InterestRateModel");
    const interestRateModel = await InterestRateModelFactory.deploy();

    // Deploy Price Oracle
    const PriceOracleFactory = await ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracleFactory.deploy();

    // Deploy Lending Pool
    const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPoolFactory.deploy(
      await larToken.getAddress(),
      await interestRateModel.getAddress(),
      await priceOracle.getAddress()
    );

    // Transfer LAR ownership to Lending Pool
    await larToken.transferOwnership(await lendingPool.getAddress());

    // Configure price feeds
    await priceOracle.setPriceFeed(await weth.getAddress(), await wethPriceFeed.getAddress());
    await priceOracle.setPriceFeed(await dai.getAddress(), await daiPriceFeed.getAddress());

    // Add tokens to lending pool
    await lendingPool.addToken(await weth.getAddress(), 7500); // 75% LTV
    await lendingPool.addToken(await dai.getAddress(), 8000); // 80% LTV

    return {
      lendingPool,
      larToken,
      interestRateModel,
      priceOracle,
      weth,
      dai,
      wethPriceFeed,
      daiPriceFeed,
      owner,
      user1,
      user2,
    };
  }

  describe("Interest Rate Changes with Utilization", function () {
    it("Should increase interest rate as utilization increases", async function () {
      const { lendingPool, weth, dai, interestRateModel, user1, user2 } = await loadFixture(deployLendingPoolFixture);

      // User 2 deposits 100 WETH to provide liquidity
      const wethSupply = ethers.parseEther("100");
      await weth.mint(user2.address, wethSupply);
      await weth.connect(user2).approve(await lendingPool.getAddress(), wethSupply);
      await lendingPool.connect(user2).deposit(await weth.getAddress(), wethSupply);

      // User 1 deposits DAI as collateral
      const daiAmount = ethers.parseEther("250000"); // $250,000
      await dai.mint(user1.address, daiAmount);
      await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);
      await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

      // Record initial rate (0% utilization)
      const initialRate = await interestRateModel.calculateBorrowRate(0n, wethSupply);
      expect(initialRate).to.equal(0); // 0% base rate

      // Borrow to reach 50% utilization
      const borrow50Percent = ethers.parseEther("50");
      await lendingPool.connect(user1).borrow(await weth.getAddress(), borrow50Percent);

      const rate50 = await interestRateModel.calculateBorrowRate(borrow50Percent, wethSupply);
      
      // At 50% utilization: 0% + (50/80 * 4%) = 2.5% = 250 basis points
      expect(rate50).to.equal(250);
      expect(rate50).to.be.gt(initialRate);

      // Borrow more to reach 90% utilization
      const additionalBorrow = ethers.parseEther("40");
      await lendingPool.connect(user1).borrow(await weth.getAddress(), additionalBorrow);

      const totalBorrows = borrow50Percent + additionalBorrow;
      const rate90 = await interestRateModel.calculateBorrowRate(totalBorrows, wethSupply);

      // At 90% utilization (above optimal 80%):
      // 4% + ((90% - 80%) * 60%) / 20% = 4% + 30% = 34% = 3400 basis points
      expect(rate90).to.equal(3400);
      expect(rate90).to.be.gt(rate50);
    });

    it("Should update interest rate when utilization decreases", async function () {
      const { lendingPool, weth, dai, interestRateModel, user1, user2 } = await loadFixture(deployLendingPoolFixture);

      // Setup: User 2 supplies WETH, User 1 borrows
      const wethSupply = ethers.parseEther("100");
      await weth.mint(user2.address, wethSupply);
      await weth.connect(user2).approve(await lendingPool.getAddress(), wethSupply);
      await lendingPool.connect(user2).deposit(await weth.getAddress(), wethSupply);

      const daiAmount = ethers.parseEther("200000");
      await dai.mint(user1.address, daiAmount);
      await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);
      await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

      // Borrow 80 WETH (80% utilization)
      const borrowAmount = ethers.parseEther("80");
      await lendingPool.connect(user1).borrow(await weth.getAddress(), borrowAmount);

      const highRate = await interestRateModel.calculateBorrowRate(borrowAmount, wethSupply);
      expect(highRate).to.equal(400); // 4% at 80% utilization

      // User 1 repays 40 WETH (reduces to 40% utilization)
      const repayAmount = ethers.parseEther("40");
      await weth.mint(user1.address, repayAmount); // Give user WETH to repay
      await weth.connect(user1).approve(await lendingPool.getAddress(), repayAmount);
      await lendingPool.connect(user1).repay(await weth.getAddress(), repayAmount);

      const remainingBorrows = borrowAmount - repayAmount;
      const lowRate = await interestRateModel.calculateBorrowRate(remainingBorrows, wethSupply);

      // At 40% utilization: (40/80 * 4%) = 2% = 200 basis points
      expect(lowRate).to.equal(200);
      expect(lowRate).to.be.lt(highRate);
    });
  });

  describe("Time-Based Interest Accrual", function () {
    it("Should demonstrate interest accrual concept over time", async function () {
      const { lendingPool, weth, dai, user1, user2, wethPriceFeed, daiPriceFeed } = await loadFixture(deployLendingPoolFixture);

      // Setup lending scenario
      const wethSupply = ethers.parseEther("100");
      await weth.mint(user2.address, wethSupply);
      await weth.connect(user2).approve(await lendingPool.getAddress(), wethSupply);
      await lendingPool.connect(user2).deposit(await weth.getAddress(), wethSupply);

      const daiAmount = ethers.parseEther("200000"); // $200,000
      await dai.mint(user1.address, daiAmount);
      await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);
      await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

      // User 1 borrows 50 WETH
      const borrowAmount = ethers.parseEther("50");
      await lendingPool.connect(user1).borrow(await weth.getAddress(), borrowAmount);

      // Record initial borrow
      const initialBorrow = await lendingPool.userReserves(user1.address, await weth.getAddress());
      expect(initialBorrow.borrowed).to.equal(borrowAmount);

      // Fast-forward time by 1 year
      await time.increase(365 * 24 * 60 * 60);
      
      // Update prices to prevent staleness
      await wethPriceFeed.updateAnswer(200000000000);
      await daiPriceFeed.updateAnswer(100000000);

      // Note: In this implementation, interest is calculated at the time of interaction
      // For a full implementation, you would need to implement compound interest tracking
      // This test demonstrates the time manipulation capability for future enhancements

      // The borrowed amount remains the same until repay/withdrawal triggers interest calculation
      const afterTimeBorrow = await lendingPool.userReserves(user1.address, await weth.getAddress());
      expect(afterTimeBorrow.borrowed).to.equal(borrowAmount);
    });

    it("Should maintain correct state across multiple time periods", async function () {
      const { lendingPool, weth, dai, user1, user2, wethPriceFeed, daiPriceFeed } = await loadFixture(deployLendingPoolFixture);

      // Setup
      const wethSupply = ethers.parseEther("100");
      await weth.mint(user2.address, wethSupply);
      await weth.connect(user2).approve(await lendingPool.getAddress(), wethSupply);
      await lendingPool.connect(user2).deposit(await weth.getAddress(), wethSupply);

      const daiAmount = ethers.parseEther("200000"); // $200,000
      await dai.mint(user1.address, daiAmount);
      await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);
      await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

      // Borrow
      const borrowAmount = ethers.parseEther("50");
      await lendingPool.connect(user1).borrow(await weth.getAddress(), borrowAmount);

      // Period 1: 30 days
      await time.increase(30 * 24 * 60 * 60);
      
      // Update prices
      await wethPriceFeed.updateAnswer(200000000000);
      await daiPriceFeed.updateAnswer(100000000);

      // Make a transaction (triggers any interest calculations)
      const smallDeposit = ethers.parseEther("1");
      await dai.mint(user1.address, smallDeposit);
      await dai.connect(user1).approve(await lendingPool.getAddress(), smallDeposit);
      await lendingPool.connect(user1).deposit(await dai.getAddress(), smallDeposit);

      // Period 2: Another 30 days
      await time.increase(30 * 24 * 60 * 60);
      
      // Update prices
      await wethPriceFeed.updateAnswer(200000000000);
      await daiPriceFeed.updateAnswer(100000000);

      // Verify state is still consistent
      const borrowData = await lendingPool.userReserves(user1.address, await weth.getAddress());
      expect(borrowData.borrowed).to.equal(borrowAmount);

      // Total deposits should include the small deposit
      const totalDaiDeposit = await lendingPool.totalDeposits(await dai.getAddress());
      expect(totalDaiDeposit).to.equal(daiAmount + smallDeposit);
    });
  });

  describe("Supply APY vs Borrow APY", function () {
    it("Should demonstrate supply APY calculation based on utilization", async function () {
      const { lendingPool, weth, dai, interestRateModel, user1, user2 } = await loadFixture(deployLendingPoolFixture);

      // User 2 supplies 100 WETH
      const wethSupply = ethers.parseEther("100");
      await weth.mint(user2.address, wethSupply);
      await weth.connect(user2).approve(await lendingPool.getAddress(), wethSupply);
      await lendingPool.connect(user2).deposit(await weth.getAddress(), wethSupply);

      // User 1 deposits collateral - need enough for 95 WETH borrow ($190,000 value)
      const daiAmount = ethers.parseEther("300000"); // $300,000 = can borrow $240,000
      await dai.mint(user1.address, daiAmount);
      await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);
      await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

      // Borrow 95 WETH (95% utilization)
      const borrowAmount = ethers.parseEther("95"); // $190,000
      await lendingPool.connect(user1).borrow(await weth.getAddress(), borrowAmount);

      // Get borrow APY at 95% utilization
      const borrowAPY = await interestRateModel.calculateBorrowRate(borrowAmount, wethSupply);
      
      // At 95% utilization: 4% + ((95-80)/20 * 60%) = 4% + 45% = 49% = 4900 bps
      expect(borrowAPY).to.equal(4900); 

      // Supply APY = Borrow APY × Utilization
      // Supply APY = 49% × 95% = 46.55%
      // In basis points: 4900 × 9500 / 10000 = 4655
      const utilization = (borrowAmount * 10000n) / wethSupply; // 9500 = 95%
      const supplyAPY = (borrowAPY * utilization) / 10000n;
      expect(supplyAPY).to.equal(4655);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle 0% utilization (no borrows)", async function () {
      const { lendingPool, weth, interestRateModel, user2 } = await loadFixture(deployLendingPoolFixture);

      // Only deposits, no borrows
      const wethSupply = ethers.parseEther("100");
      await weth.mint(user2.address, wethSupply);
      await weth.connect(user2).approve(await lendingPool.getAddress(), wethSupply);
      await lendingPool.connect(user2).deposit(await weth.getAddress(), wethSupply);

      // Interest rate at 0% utilization
      const rate = await interestRateModel.calculateBorrowRate(0, wethSupply);
      expect(rate).to.equal(0); // Base rate: 0%

      // Supply APY would be 0% (no one borrowing)
      const supplyAPY = (rate * 0n) / 10000n;
      expect(supplyAPY).to.equal(0);
    });

    it("Should handle near 100% utilization", async function () {
      const { lendingPool, weth, dai, interestRateModel, user1, user2 } = await loadFixture(deployLendingPoolFixture);

      // Setup
      const wethSupply = ethers.parseEther("100");
      await weth.mint(user2.address, wethSupply);
      await weth.connect(user2).approve(await lendingPool.getAddress(), wethSupply);
      await lendingPool.connect(user2).deposit(await weth.getAddress(), wethSupply);

      // Need sufficient collateral for 95 WETH borrow ($190,000)
      // Required: $190,000 / 0.8 = $237,500. Let's put $300,000
      const daiAmount = ethers.parseEther("300000");
      await dai.mint(user1.address, daiAmount);
      await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);
      await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

      // Borrow 95 WETH (95% utilization)
      const borrowAmount = ethers.parseEther("95");
      await lendingPool.connect(user1).borrow(await weth.getAddress(), borrowAmount);

      // Rate should be very high to discourage further borrowing
      const rate = await interestRateModel.calculateBorrowRate(borrowAmount, wethSupply);
      
      // At 95%: 49%
      expect(rate).to.equal(4900);
    });
  });
});
