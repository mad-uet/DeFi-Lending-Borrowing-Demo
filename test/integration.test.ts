import { expect } from "chai";
import { ethers } from "hardhat";
import { MockERC20, MockV3Aggregator } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Integration: Mock Ecosystem", function () {
  let weth: MockERC20;
  let dai: MockERC20;
  let usdc: MockERC20;
  let link: MockERC20;
  let wethPriceFeed: MockV3Aggregator;
  let daiPriceFeed: MockV3Aggregator;
  let usdcPriceFeed: MockV3Aggregator;
  let linkPriceFeed: MockV3Aggregator;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");

    // Deploy tokens as per specification
    weth = await MockERC20Factory.deploy("Wrapped Ether", "WETH", 18);
    dai = await MockERC20Factory.deploy("Dai Stablecoin", "DAI", 18);
    usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    link = await MockERC20Factory.deploy("Chainlink Token", "LINK", 18);

    // Deploy price feeds with initial prices
    wethPriceFeed = await MockV3AggregatorFactory.deploy(8, 2000_00000000); // $2000
    daiPriceFeed = await MockV3AggregatorFactory.deploy(8, 1_00000000);     // $1
    usdcPriceFeed = await MockV3AggregatorFactory.deploy(8, 1_00000000);    // $1
    linkPriceFeed = await MockV3AggregatorFactory.deploy(8, 15_00000000);   // $15

    await Promise.all([
      weth.waitForDeployment(),
      dai.waitForDeployment(),
      usdc.waitForDeployment(),
      link.waitForDeployment(),
      wethPriceFeed.waitForDeployment(),
      daiPriceFeed.waitForDeployment(),
      usdcPriceFeed.waitForDeployment(),
      linkPriceFeed.waitForDeployment(),
    ]);
  });

  describe("Token Ecosystem Setup", function () {
    it("Should deploy all 4 tokens with correct properties", async function () {
      expect(await weth.symbol()).to.equal("WETH");
      expect(await weth.decimals()).to.equal(18);
      
      expect(await dai.symbol()).to.equal("DAI");
      expect(await dai.decimals()).to.equal(18);
      
      expect(await usdc.symbol()).to.equal("USDC");
      expect(await usdc.decimals()).to.equal(6);
      
      expect(await link.symbol()).to.equal("LINK");
      expect(await link.decimals()).to.equal(18);
    });

    it("Should deploy all 4 price feeds with correct initial prices", async function () {
      let roundData = await wethPriceFeed.latestRoundData();
      expect(roundData.answer).to.equal(2000_00000000);
      
      roundData = await daiPriceFeed.latestRoundData();
      expect(roundData.answer).to.equal(1_00000000);
      
      roundData = await usdcPriceFeed.latestRoundData();
      expect(roundData.answer).to.equal(1_00000000);
      
      roundData = await linkPriceFeed.latestRoundData();
      expect(roundData.answer).to.equal(15_00000000);
    });
  });

  describe("Multi-User Token Distribution", function () {
    it("Should mint tokens to multiple users", async function () {
      // Mint WETH to users
      await weth.mint(user1.address, ethers.parseEther("10"));
      await weth.mint(user2.address, ethers.parseEther("5"));
      
      expect(await weth.balanceOf(user1.address)).to.equal(ethers.parseEther("10"));
      expect(await weth.balanceOf(user2.address)).to.equal(ethers.parseEther("5"));
      
      // Mint DAI to users
      await dai.mint(user1.address, ethers.parseEther("5000"));
      await dai.mint(user2.address, ethers.parseEther("3000"));
      
      expect(await dai.balanceOf(user1.address)).to.equal(ethers.parseEther("5000"));
      expect(await dai.balanceOf(user2.address)).to.equal(ethers.parseEther("3000"));
    });

    it("Should handle USDC with different decimals", async function () {
      // USDC has 6 decimals
      const user1USDC = 1000_000000n; // 1000 USDC
      const user2USDC = 500_000000n;  // 500 USDC
      
      await usdc.mint(user1.address, user1USDC);
      await usdc.mint(user2.address, user2USDC);
      
      expect(await usdc.balanceOf(user1.address)).to.equal(user1USDC);
      expect(await usdc.balanceOf(user2.address)).to.equal(user2USDC);
    });
  });

  describe("Token Transfer Scenarios", function () {
    beforeEach(async function () {
      await weth.mint(owner.address, ethers.parseEther("100"));
      await dai.mint(owner.address, ethers.parseEther("10000"));
    });

    it("Should transfer tokens between users", async function () {
      const transferAmount = ethers.parseEther("50");
      await weth.transfer(user1.address, transferAmount);
      
      expect(await weth.balanceOf(user1.address)).to.be.greaterThan(0);
    });

    it("Should allow approved transfers", async function () {
      const approveAmount = ethers.parseEther("100");
      await dai.approve(user1.address, approveAmount);
      
      await dai.connect(user1).transferFrom(
        owner.address,
        user2.address,
        ethers.parseEther("50")
      );
      
      expect(await dai.balanceOf(user2.address)).to.be.greaterThan(0);
    });
  });

  describe("Price Feed Integration", function () {
    it("Should calculate collateral value using price feeds", async function () {
      // User has 1 WETH worth $2000
      const wethAmount = ethers.parseEther("1");
      const wethPrice = (await wethPriceFeed.latestRoundData()).answer;
      const wethDecimals = await wethPriceFeed.decimals();
      
      // Calculate value: (1 WETH * $2000) / 10^8 = $2000
      const valueInUSD = (wethAmount * BigInt(wethPrice)) / (10n ** BigInt(wethDecimals));
      expect(valueInUSD).to.equal(ethers.parseEther("2000"));
    });

    it("Should calculate borrowing capacity based on collateral", async function () {
      // User has 10 LINK worth $15 each = $150 total
      const linkAmount = ethers.parseEther("10");
      const linkPrice = (await linkPriceFeed.latestRoundData()).answer;
      const linkDecimals = await linkPriceFeed.decimals();
      
      const totalValueInUSD = (linkAmount * BigInt(linkPrice)) / (10n ** BigInt(linkDecimals));
      expect(totalValueInUSD).to.equal(ethers.parseEther("150"));
      
      // Assuming 75% LTV, can borrow 75% of collateral value
      const borrowCapacity = (totalValueInUSD * 75n) / 100n;
      expect(borrowCapacity).to.equal(ethers.parseEther("112.5"));
    });

    it("Should update prices dynamically", async function () {
      // WETH price increases to $2500
      await wethPriceFeed.updateAnswer(2500_00000000);
      
      let roundData = await wethPriceFeed.latestRoundData();
      expect(roundData.answer).to.equal(2500_00000000);
      expect(roundData.roundId).to.equal(2); // Round incremented
      
      // DAI stays at $1 (stablecoin)
      roundData = await daiPriceFeed.latestRoundData();
      expect(roundData.answer).to.equal(1_00000000);
      expect(roundData.roundId).to.equal(1); // No update
    });
  });

  describe("Simulated Lending Scenario Preparation", function () {
    it("Should prepare a lending scenario: User deposits WETH, borrows DAI", async function () {
      // Deploy fresh contracts for this test to avoid price changes from other tests
      const MockERC20Factory = await ethers.getContractFactory("MockERC20");
      const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
      
      const testWeth = await MockERC20Factory.deploy("Wrapped Ether", "WETH", 18);
      const testDai = await MockERC20Factory.deploy("Dai Stablecoin", "DAI", 18);
      const testWethPriceFeed = await MockV3AggregatorFactory.deploy(8, 2000_00000000);
      
      await testWeth.waitForDeployment();
      await testDai.waitForDeployment();
      await testWethPriceFeed.waitForDeployment();
      
      // User 1 deposits 5 WETH as collateral
      const wethCollateral = ethers.parseEther("5");
      await testWeth.mint(user1.address, wethCollateral);
      expect(await testWeth.balanceOf(user1.address)).to.equal(wethCollateral);
      
      // Calculate WETH value in USD
      const wethPrice = (await testWethPriceFeed.latestRoundData()).answer;
      const wethDecimals = await testWethPriceFeed.decimals();
      const collateralValueUSD = (wethCollateral * BigInt(wethPrice)) / (10n ** BigInt(wethDecimals));
      
      // 5 WETH * $2000 = $10,000
      expect(collateralValueUSD).to.equal(ethers.parseEther("10000"));
      
      // At 75% LTV, can borrow up to $7,500 worth of DAI
      const maxBorrowUSD = (collateralValueUSD * 75n) / 100n;
      expect(maxBorrowUSD).to.equal(ethers.parseEther("7500"));
      
      // Since DAI is $1, can borrow 7,500 DAI
      const daiToBorrow = ethers.parseEther("7500");
      
      // Mint DAI to simulate lending pool having liquidity
      await testDai.mint(owner.address, ethers.parseEther("100000"));
      
      // Simulate lending pool transferring DAI to borrower
      await testDai.transfer(user1.address, daiToBorrow);
      expect(await testDai.balanceOf(user1.address)).to.equal(daiToBorrow);
    });

    it("Should handle USDC borrowing with different decimals", async function () {
      // Get initial balance
      const initialUsdcBalance = await usdc.balanceOf(user2.address);
      
      // User 2 deposits 10 LINK as collateral
      const linkCollateral = ethers.parseEther("10");
      await link.mint(user2.address, linkCollateral);
      
      // Calculate LINK value: 10 LINK * $15 = $150
      const linkPrice = (await linkPriceFeed.latestRoundData()).answer;
      const linkDecimals = await linkPriceFeed.decimals();
      const collateralValueUSD = (linkCollateral * BigInt(linkPrice)) / (10n ** BigInt(linkDecimals));
      expect(collateralValueUSD).to.equal(ethers.parseEther("150"));
      
      // At 75% LTV, can borrow $112.50 worth of USDC
      const maxBorrowUSD = (collateralValueUSD * 75n) / 100n;
      
      // USDC has 6 decimals, so convert properly
      const usdcToBorrow = 112_500000n; // 112.5 USDC with 6 decimals
      
      await usdc.mint(owner.address, 1000000_000000n); // 1M USDC
      await usdc.transfer(user2.address, usdcToBorrow);
      
      const finalUsdcBalance = await usdc.balanceOf(user2.address);
      expect(finalUsdcBalance - initialUsdcBalance).to.equal(usdcToBorrow);
    });
  });

  describe("Gas Efficiency Check", function () {
    it("Should perform token operations efficiently", async function () {
      const mintTx = await weth.mint(user1.address, ethers.parseEther("1"));
      const receipt = await mintTx.wait();
      expect(receipt!.gasUsed).to.be.lessThan(100000); // Should be around 51-68k gas
      
      const transferTx = await weth.connect(user1).transfer(user2.address, ethers.parseEther("0.5"));
      const transferReceipt = await transferTx.wait();
      expect(transferReceipt!.gasUsed).to.be.lessThan(100000); // Should be around 51k gas
    });

    it("Should update price feeds efficiently", async function () {
      const updateTx = await wethPriceFeed.updateAnswer(2100_00000000);
      const receipt = await updateTx.wait();
      expect(receipt!.gasUsed).to.be.lessThan(50000); // Should be around 31-36k gas
    });
  });
});
