import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { LendingPool, LARToken, InterestRateModel, PriceOracle, MockERC20, MockV3Aggregator } from "../../typechain-types";

describe("Multi-User Scenarios", function () {
  // Deployment fixture
  async function deployLendingPoolFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const weth = await MockERC20Factory.deploy("Wrapped Ether", "WETH", 18);
    const dai = await MockERC20Factory.deploy("Dai Stablecoin", "DAI", 18);
    const usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    const link = await MockERC20Factory.deploy("Chainlink", "LINK", 18);

    // Deploy mock price feeds
    const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
    const wethPriceFeed = await MockV3AggregatorFactory.deploy(8, 200000000000); // $2,000
    const daiPriceFeed = await MockV3AggregatorFactory.deploy(8, 100000000); // $1
    const usdcPriceFeed = await MockV3AggregatorFactory.deploy(8, 100000000); // $1
    const linkPriceFeed = await MockV3AggregatorFactory.deploy(8, 1500000000); // $15

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
    await priceOracle.setPriceFeed(await usdc.getAddress(), await usdcPriceFeed.getAddress());
    await priceOracle.setPriceFeed(await link.getAddress(), await linkPriceFeed.getAddress());

    // Add tokens to lending pool
    await lendingPool.addToken(await weth.getAddress(), 7500); // 75% LTV
    await lendingPool.addToken(await dai.getAddress(), 8000); // 80% LTV
    await lendingPool.addToken(await usdc.getAddress(), 8000); // 80% LTV
    await lendingPool.addToken(await link.getAddress(), 6000); // 60% LTV

    return {
      lendingPool,
      larToken,
      interestRateModel,
      priceOracle,
      weth,
      dai,
      usdc,
      link,
      owner,
      user1,
      user2,
      user3,
    };
  }

  describe("Multiple Users Depositing and Borrowing", function () {
    it("Should handle multiple users depositing different tokens simultaneously", async function () {
      const { lendingPool, weth, dai, usdc, user1, user2, user3 } = await loadFixture(deployLendingPoolFixture);

      // User 1 deposits WETH
      const wethAmount = ethers.parseEther("10");
      await weth.mint(user1.address, wethAmount);
      await weth.connect(user1).approve(await lendingPool.getAddress(), wethAmount);
      await lendingPool.connect(user1).deposit(await weth.getAddress(), wethAmount);

      // User 2 deposits DAI
      const daiAmount = ethers.parseEther("5000");
      await dai.mint(user2.address, daiAmount);
      await dai.connect(user2).approve(await lendingPool.getAddress(), daiAmount);
      await lendingPool.connect(user2).deposit(await dai.getAddress(), daiAmount);

      // User 3 deposits USDC
      const usdcAmount = ethers.parseUnits("3000", 6);
      await usdc.mint(user3.address, usdcAmount);
      await usdc.connect(user3).approve(await lendingPool.getAddress(), usdcAmount);
      await lendingPool.connect(user3).deposit(await usdc.getAddress(), usdcAmount);

      // Verify total deposits
      expect(await lendingPool.totalDeposits(await weth.getAddress())).to.equal(wethAmount);
      expect(await lendingPool.totalDeposits(await dai.getAddress())).to.equal(daiAmount);
      expect(await lendingPool.totalDeposits(await usdc.getAddress())).to.equal(usdcAmount);

      // Verify user deposits
      const user1Data = await lendingPool.userReserves(user1.address, await weth.getAddress());
      const user2Data = await lendingPool.userReserves(user2.address, await dai.getAddress());
      const user3Data = await lendingPool.userReserves(user3.address, await usdc.getAddress());

      expect(user1Data.deposited).to.equal(wethAmount);
      expect(user2Data.deposited).to.equal(daiAmount);
      expect(user3Data.deposited).to.equal(usdcAmount);
    });

    it("Should handle cross-user borrowing (User A supplies, User B borrows)", async function () {
      const { lendingPool, weth, dai, user1, user2 } = await loadFixture(deployLendingPoolFixture);

      // User 1 supplies 10 WETH
      const wethAmount = ethers.parseEther("10");
      await weth.mint(user1.address, wethAmount);
      await weth.connect(user1).approve(await lendingPool.getAddress(), wethAmount);
      await lendingPool.connect(user1).deposit(await weth.getAddress(), wethAmount);

      // User 2 supplies DAI as collateral and borrows WETH
      const daiAmount = ethers.parseEther("20000"); // $20,000 = can borrow $16,000
      await dai.mint(user2.address, daiAmount);
      await dai.connect(user2).approve(await lendingPool.getAddress(), daiAmount);
      await lendingPool.connect(user2).deposit(await dai.getAddress(), daiAmount);

      // User 2 borrows 5 WETH ($10,000 value)
      const borrowAmount = ethers.parseEther("5");
      await lendingPool.connect(user2).borrow(await weth.getAddress(), borrowAmount);

      // Verify pool state
      expect(await lendingPool.totalDeposits(await weth.getAddress())).to.equal(wethAmount);
      expect(await lendingPool.totalBorrows(await weth.getAddress())).to.equal(borrowAmount);

      // Verify User 2 received WETH
      expect(await weth.balanceOf(user2.address)).to.equal(borrowAmount);

      // Verify User 2's borrow record
      const user2WethData = await lendingPool.userReserves(user2.address, await weth.getAddress());
      expect(user2WethData.borrowed).to.equal(borrowAmount);
    });

    it("Should allow User 1 to withdraw only unborrowed portion", async function () {
      const { lendingPool, weth, dai, user1, user2 } = await loadFixture(deployLendingPoolFixture);

      // User 1 supplies 10 WETH
      const wethAmount = ethers.parseEther("10");
      await weth.mint(user1.address, wethAmount);
      await weth.connect(user1).approve(await lendingPool.getAddress(), wethAmount);
      await lendingPool.connect(user1).deposit(await weth.getAddress(), wethAmount);

      // User 2 supplies DAI and borrows 7 WETH
      const daiAmount = ethers.parseEther("25000"); // $25,000 = can borrow $20,000
      await dai.mint(user2.address, daiAmount);
      await dai.connect(user2).approve(await lendingPool.getAddress(), daiAmount);
      await lendingPool.connect(user2).deposit(await dai.getAddress(), daiAmount);

      const borrowAmount = ethers.parseEther("7"); // $14,000
      await lendingPool.connect(user2).borrow(await weth.getAddress(), borrowAmount);

      // User 1 can withdraw up to 3 WETH (10 - 7 borrowed)
      const availableToWithdraw = ethers.parseEther("3");
      await lendingPool.connect(user1).withdraw(await weth.getAddress(), availableToWithdraw);

      // Verify User 1 received WETH
      expect(await weth.balanceOf(user1.address)).to.equal(availableToWithdraw);

      // Trying to withdraw more should fail
      await expect(
        lendingPool.connect(user1).withdraw(await weth.getAddress(), ethers.parseEther("1"))
      ).to.be.reverted; // Reverts because pool has insufficient liquidity (ERC20 transfer fails)
    });
  });

  describe("Utilization Rate Calculation", function () {
    it("Should calculate correct utilization with multiple users", async function () {
      const { lendingPool, weth, dai, user1, user2, user3 } = await loadFixture(deployLendingPoolFixture);

      // Multiple users supply WETH
      const user1Amount = ethers.parseEther("10");
      const user2Amount = ethers.parseEther("15");
      const user3Amount = ethers.parseEther("25");

      await weth.mint(user1.address, user1Amount);
      await weth.connect(user1).approve(await lendingPool.getAddress(), user1Amount);
      await lendingPool.connect(user1).deposit(await weth.getAddress(), user1Amount);

      await weth.mint(user2.address, user2Amount);
      await weth.connect(user2).approve(await lendingPool.getAddress(), user2Amount);
      await lendingPool.connect(user2).deposit(await weth.getAddress(), user2Amount);

      await weth.mint(user3.address, user3Amount);
      await weth.connect(user3).approve(await lendingPool.getAddress(), user3Amount);
      await lendingPool.connect(user3).deposit(await weth.getAddress(), user3Amount);

      // Total deposits: 50 WETH
      const totalDeposits = user1Amount + user2Amount + user3Amount;
      expect(await lendingPool.totalDeposits(await weth.getAddress())).to.equal(totalDeposits);

      // User 1 borrows using DAI collateral
      const daiAmount = ethers.parseEther("50000");
      await dai.mint(user1.address, daiAmount);
      await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);
      await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

      const borrowAmount = ethers.parseEther("25"); // 50% utilization
      await lendingPool.connect(user1).borrow(await weth.getAddress(), borrowAmount);

      // Verify utilization
      const totalBorrows = await lendingPool.totalBorrows(await weth.getAddress());
      expect(totalBorrows).to.equal(borrowAmount);

      // Utilization = 25 / 50 = 50%
      const utilization = (totalBorrows * 10000n) / totalDeposits;
      expect(utilization).to.equal(5000); // 50% in basis points
    });
  });

  describe("Concurrent Deposits and Withdrawals", function () {
    it("Should handle concurrent deposits and withdrawals correctly", async function () {
      const { lendingPool, weth, user1, user2, user3 } = await loadFixture(deployLendingPoolFixture);

      // User 1 deposits 10 WETH
      const user1DepositAmount = ethers.parseEther("10");
      await weth.mint(user1.address, user1DepositAmount);
      await weth.connect(user1).approve(await lendingPool.getAddress(), user1DepositAmount);
      await lendingPool.connect(user1).deposit(await weth.getAddress(), user1DepositAmount);

      // User 2 deposits 15 WETH
      const user2DepositAmount = ethers.parseEther("15");
      await weth.mint(user2.address, user2DepositAmount);
      await weth.connect(user2).approve(await lendingPool.getAddress(), user2DepositAmount);
      await lendingPool.connect(user2).deposit(await weth.getAddress(), user2DepositAmount);

      // Total: 25 WETH
      expect(await lendingPool.totalDeposits(await weth.getAddress())).to.equal(
        user1DepositAmount + user2DepositAmount
      );

      // User 1 withdraws 5 WETH while User 3 deposits 20 WETH
      const user1WithdrawAmount = ethers.parseEther("5");
      const user3DepositAmount = ethers.parseEther("20");

      await weth.mint(user3.address, user3DepositAmount);
      await weth.connect(user3).approve(await lendingPool.getAddress(), user3DepositAmount);

      // Execute withdrawal and deposit
      await lendingPool.connect(user1).withdraw(await weth.getAddress(), user1WithdrawAmount);
      await lendingPool.connect(user3).deposit(await weth.getAddress(), user3DepositAmount);

      // Total should be: 25 - 5 + 20 = 40 WETH
      const expectedTotal = user1DepositAmount + user2DepositAmount - user1WithdrawAmount + user3DepositAmount;
      expect(await lendingPool.totalDeposits(await weth.getAddress())).to.equal(expectedTotal);

      // Verify individual balances
      const user1Data = await lendingPool.userReserves(user1.address, await weth.getAddress());
      const user2Data = await lendingPool.userReserves(user2.address, await weth.getAddress());
      const user3Data = await lendingPool.userReserves(user3.address, await weth.getAddress());

      expect(user1Data.deposited).to.equal(user1DepositAmount - user1WithdrawAmount);
      expect(user2Data.deposited).to.equal(user2DepositAmount);
      expect(user3Data.deposited).to.equal(user3DepositAmount);
    });
  });

  describe("Multi-Collateral Borrowing", function () {
    it("Should calculate correct borrowing power with multiple collateral types", async function () {
      const { lendingPool, weth, dai, usdc, link, user1, user2 } = await loadFixture(deployLendingPoolFixture);

      // User 2 supplies LINK liquidity
      const linkLiquidity = ethers.parseEther("1000"); // 1000 LINK
      await link.mint(user2.address, linkLiquidity);
      await link.connect(user2).approve(await lendingPool.getAddress(), linkLiquidity);
      await lendingPool.connect(user2).deposit(await link.getAddress(), linkLiquidity);

      // User 1 supplies multiple collateral types
      const wethAmount = ethers.parseEther("5"); // $10,000 * 0.75 = $7,500
      const daiAmount = ethers.parseEther("2000"); // $2,000 * 0.80 = $1,600
      const usdcAmount = ethers.parseUnits("1000", 6); // $1,000 * 0.80 = $800

      await weth.mint(user1.address, wethAmount);
      await weth.connect(user1).approve(await lendingPool.getAddress(), wethAmount);
      await lendingPool.connect(user1).deposit(await weth.getAddress(), wethAmount);

      await dai.mint(user1.address, daiAmount);
      await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);
      await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

      await usdc.mint(user1.address, usdcAmount);
      await usdc.connect(user1).approve(await lendingPool.getAddress(), usdcAmount);
      await lendingPool.connect(user1).deposit(await usdc.getAddress(), usdcAmount);

      // Total borrowing power: $7,500 + $1,600 + $800 = $9,900
      const accountData = await lendingPool.getUserAccountData(user1.address);
      
      // Expected: ($10,000 + $2,000 + $1,000) * 1e18 = $13,000 * 1e18
      const expectedCollateral = ethers.parseEther("13000");
      expect(accountData.totalCollateralUSD).to.equal(expectedCollateral);

      // User can borrow up to $9,900 worth
      // Borrow LINK: $9,900 / $15 = 660 LINK
      const linkToBorrow = ethers.parseEther("600"); // Conservative
      await lendingPool.connect(user1).borrow(await link.getAddress(), linkToBorrow);

      // Verify borrow succeeded
      expect(await link.balanceOf(user1.address)).to.equal(linkToBorrow);

      // Health factor should be > 1
      const { healthFactor } = await lendingPool.getUserAccountData(user1.address);
      expect(healthFactor).to.be.gt(ethers.parseEther("1"));
    });
  });
});
