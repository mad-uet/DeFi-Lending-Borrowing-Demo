import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingPool, LARToken, InterestRateModel, MockERC20, MockV3Aggregator } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LendingPool - Calculations", function () {
    let lendingPool: LendingPool;
    let larToken: LARToken;
    let interestRateModel: InterestRateModel;
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

    const WETH_PRICE = 2000_00000000;
    const DAI_PRICE = 1_00000000;
    const USDC_PRICE = 1_00000000;
    const LINK_PRICE = 15_00000000;

    const WETH_LTV = 7500;
    const DAI_LTV = 8000;
    const USDC_LTV = 8000;
    const LINK_LTV = 6000;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        weth = await MockERC20Factory.deploy("Wrapped Ether", "WETH", 18);
        dai = await MockERC20Factory.deploy("Dai Stablecoin", "DAI", 18);
        usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
        link = await MockERC20Factory.deploy("Chainlink", "LINK", 18);

        const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
        wethPriceFeed = await MockV3AggregatorFactory.deploy(8, WETH_PRICE);
        daiPriceFeed = await MockV3AggregatorFactory.deploy(8, DAI_PRICE);
        usdcPriceFeed = await MockV3AggregatorFactory.deploy(8, USDC_PRICE);
        linkPriceFeed = await MockV3AggregatorFactory.deploy(8, LINK_PRICE);

        const LARTokenFactory = await ethers.getContractFactory("LARToken");
        larToken = await LARTokenFactory.deploy();

        const InterestRateModelFactory = await ethers.getContractFactory("InterestRateModel");
        interestRateModel = await InterestRateModelFactory.deploy();

        const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
        lendingPool = await LendingPoolFactory.deploy(
            await larToken.getAddress(),
            await interestRateModel.getAddress()
        );

        await larToken.transferOwnership(await lendingPool.getAddress());

        await lendingPool.addToken(await weth.getAddress(), await wethPriceFeed.getAddress(), WETH_LTV);
        await lendingPool.addToken(await dai.getAddress(), await daiPriceFeed.getAddress(), DAI_LTV);
        await lendingPool.addToken(await usdc.getAddress(), await usdcPriceFeed.getAddress(), USDC_LTV);
        await lendingPool.addToken(await link.getAddress(), await linkPriceFeed.getAddress(), LINK_LTV);

        await weth.mint(user1.address, ethers.parseEther("100"));
        await dai.mint(user1.address, ethers.parseEther("100000"));
        await usdc.mint(user1.address, 100000_000000);
        await link.mint(user1.address, ethers.parseEther("10000"));

        await weth.mint(user2.address, ethers.parseEther("50"));
        await dai.mint(user2.address, ethers.parseEther("50000"));
        await usdc.mint(user2.address, 50000_000000);
    });

    describe("Total Collateral Calculation", function () {
        it("should calculate total collateral in USD correctly for single token", async function () {
            const depositAmount = ethers.parseEther("1"); // 1 WETH = $2000
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalCollateralUSD).to.equal(ethers.parseEther("2000"));
        });

        it("should calculate total collateral for multiple tokens", async function () {
            // 1 WETH = $2000
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("1"));

            // 1000 DAI = $1000
            await dai.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1000"));
            await lendingPool.connect(user1).deposit(await dai.getAddress(), ethers.parseEther("1000"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalCollateralUSD).to.equal(ethers.parseEther("3000"));
        });

        it("should handle USDC correctly (6 decimals)", async function () {
            const depositAmount = 1000_000000; // 1000 USDC = $1000
            await usdc.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await usdc.getAddress(), depositAmount);

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalCollateralUSD).to.equal(ethers.parseEther("1000"));
        });

        it("should return zero for user with no deposits", async function () {
            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalCollateralUSD).to.equal(0);
        });
    });

    describe("Total Debt Calculation", function () {
        beforeEach(async function () {
            // Setup collateral
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("5"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("5"));

            // Provide liquidity
            await dai.connect(user2).approve(await lendingPool.getAddress(), ethers.parseEther("20000"));
            await lendingPool.connect(user2).deposit(await dai.getAddress(), ethers.parseEther("20000"));
        });

        it("should calculate total debt in USD correctly for single borrow", async function () {
            const borrowAmount = ethers.parseEther("1000"); // $1000
            await lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount);

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalDebtUSD).to.equal(ethers.parseEther("1000"));
        });

        it("should calculate total debt for multiple borrows same token", async function () {
            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("500"));
            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("700"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalDebtUSD).to.equal(ethers.parseEther("1200"));
        });

        it("should calculate total debt for multiple different tokens", async function () {
            // Provide USDC liquidity
            await usdc.connect(user2).approve(await lendingPool.getAddress(), 10000_000000);
            await lendingPool.connect(user2).deposit(await usdc.getAddress(), 10000_000000);

            // Borrow both DAI and USDC
            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1000"));
            await lendingPool.connect(user1).borrow(await usdc.getAddress(), 500_000000);

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalDebtUSD).to.equal(ethers.parseEther("1500"));
        });

        it("should return zero for user with no borrows", async function () {
            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalDebtUSD).to.equal(0);
        });
    });

    describe("Available Borrows Calculation", function () {
        it("should calculate available borrows with single collateral", async function () {
            // 1 WETH = $2000, LTV 75% = $1500 borrowing power
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("1"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.availableBorrowsUSD).to.equal(ethers.parseEther("1500"));
        });

        it("should calculate available borrows with multiple collaterals", async function () {
            // 1 WETH = $2000 * 75% = $1500
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("1"));

            // 1000 DAI = $1000 * 80% = $800
            await dai.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1000"));
            await lendingPool.connect(user1).deposit(await dai.getAddress(), ethers.parseEther("1000"));

            // Total = $2300
            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.availableBorrowsUSD).to.equal(ethers.parseEther("2300"));
        });

        it("should reduce available borrows after borrowing", async function () {
            // Setup
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("2"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("2"));

            await dai.connect(user2).approve(await lendingPool.getAddress(), ethers.parseEther("10000"));
            await lendingPool.connect(user2).deposit(await dai.getAddress(), ethers.parseEther("10000"));

            // Borrow $1000
            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1000"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            // Borrowing power = $4000 * 75% = $3000
            // Borrowed = $1000
            // Available = $2000
            expect(accountData.availableBorrowsUSD).to.equal(ethers.parseEther("2000"));
        });

        it("should handle different LTV ratios correctly", async function () {
            // 100 LINK = $1500 * 60% = $900
            await link.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("100"));
            await lendingPool.connect(user1).deposit(await link.getAddress(), ethers.parseEther("100"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.availableBorrowsUSD).to.equal(ethers.parseEther("900"));
        });
    });

    describe("Health Factor Calculation", function () {
        it("should return max uint256 when no debt exists", async function () {
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("1"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.healthFactor).to.equal(ethers.MaxUint256);
        });

        it("should calculate health factor correctly", async function () {
            // Deposit $2000 WETH (75% LTV = $1500 borrowing power)
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("1"));

            // Provide liquidity
            await dai.connect(user2).approve(await lendingPool.getAddress(), ethers.parseEther("10000"));
            await lendingPool.connect(user2).deposit(await dai.getAddress(), ethers.parseEther("10000"));

            // Borrow $1000
            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1000"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            // Health factor = borrowing power / debt = $1500 / $1000 = 1.5
            expect(accountData.healthFactor).to.equal(ethers.parseEther("1.5"));
        });

        it("should calculate health factor at liquidation threshold", async function () {
            // Deposit $2000 WETH
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("1"));

            // Provide liquidity
            await dai.connect(user2).approve(await lendingPool.getAddress(), ethers.parseEther("10000"));
            await lendingPool.connect(user2).deposit(await dai.getAddress(), ethers.parseEther("10000"));

            // Borrow max: $1500
            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1500"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            // Health factor = $1500 / $1500 = 1.0
            expect(accountData.healthFactor).to.equal(ethers.parseEther("1"));
        });

        it("should calculate health factor with multiple collaterals", async function () {
            // WETH: $2000 * 75% = $1500
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("1"));

            // DAI: $1000 * 80% = $800
            await dai.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1000"));
            await lendingPool.connect(user1).deposit(await dai.getAddress(), ethers.parseEther("1000"));

            // Provide USDC liquidity
            await usdc.connect(user2).approve(await lendingPool.getAddress(), 10000_000000);
            await lendingPool.connect(user2).deposit(await usdc.getAddress(), 10000_000000);

            // Borrow $1150
            await lendingPool.connect(user1).borrow(await usdc.getAddress(), 1150_000000);

            const accountData = await lendingPool.getUserAccountData(user1.address);
            // Health factor = $2300 / $1150 = 2.0
            expect(accountData.healthFactor).to.equal(ethers.parseEther("2"));
        });
    });

    describe("Asset Price Retrieval", function () {
        it("should return correct price for WETH", async function () {
            const price = await lendingPool.getAssetPrice(await weth.getAddress());
            expect(price).to.equal(WETH_PRICE);
        });

        it("should return correct price for DAI", async function () {
            const price = await lendingPool.getAssetPrice(await dai.getAddress());
            expect(price).to.equal(DAI_PRICE);
        });

        it("should return correct price for USDC", async function () {
            const price = await lendingPool.getAssetPrice(await usdc.getAddress());
            expect(price).to.equal(USDC_PRICE);
        });

        it("should return correct price for LINK", async function () {
            const price = await lendingPool.getAssetPrice(await link.getAddress());
            expect(price).to.equal(LINK_PRICE);
        });

        it("should revert for token without price feed", async function () {
            const unsupportedToken = await (await ethers.getContractFactory("MockERC20"))
                .deploy("Unsupported", "UNS", 18);

            await expect(
                lendingPool.getAssetPrice(await unsupportedToken.getAddress())
            ).to.be.revertedWith("Price feed not set");
        });
    });

    describe("Price Fluctuation Scenarios", function () {
        it("should recalculate values when WETH price increases", async function () {
            // Deposit 1 WETH at $2000
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("1"));

            let accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalCollateralUSD).to.equal(ethers.parseEther("2000"));

            // Update WETH price to $2500
            await wethPriceFeed.updateAnswer(2500_00000000);

            accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalCollateralUSD).to.equal(ethers.parseEther("2500"));
            expect(accountData.availableBorrowsUSD).to.equal(ethers.parseEther("1875")); // $2500 * 75%
        });

        it("should recalculate health factor when collateral price drops", async function () {
            // Setup with WETH at $2000
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("1"));

            await dai.connect(user2).approve(await lendingPool.getAddress(), ethers.parseEther("10000"));
            await lendingPool.connect(user2).deposit(await dai.getAddress(), ethers.parseEther("10000"));

            // Borrow $1000
            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1000"));

            let accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.healthFactor).to.equal(ethers.parseEther("1.5")); // $1500 / $1000

            // Drop WETH price to $1500
            await wethPriceFeed.updateAnswer(1500_00000000);

            accountData = await lendingPool.getUserAccountData(user1.address);
            // New borrowing power = $1500 * 75% = $1125
            // Health factor = $1125 / $1000 = 1.125
            expect(accountData.healthFactor).to.equal(ethers.parseEther("1.125"));
        });

        it("should handle stablecoin price stability", async function () {
            // Deposit 1000 DAI
            await dai.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1000"));
            await lendingPool.connect(user1).deposit(await dai.getAddress(), ethers.parseEther("1000"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalCollateralUSD).to.equal(ethers.parseEther("1000"));
            expect(accountData.availableBorrowsUSD).to.equal(ethers.parseEther("800")); // 80% LTV
        });
    });

    describe("Edge Cases", function () {
        it("should handle zero deposits scenario", async function () {
            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalCollateralUSD).to.equal(0);
            expect(accountData.totalDebtUSD).to.equal(0);
            expect(accountData.availableBorrowsUSD).to.equal(0);
            expect(accountData.healthFactor).to.equal(ethers.MaxUint256);
        });

        it("should handle zero borrows scenario", async function () {
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("1"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalDebtUSD).to.equal(0);
            expect(accountData.healthFactor).to.equal(ethers.MaxUint256);
        });

        it("should correctly calculate with very small amounts", async function () {
            // Deposit 0.001 WETH = $2
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("0.001"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("0.001"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalCollateralUSD).to.equal(ethers.parseEther("2"));
            expect(accountData.availableBorrowsUSD).to.equal(ethers.parseEther("1.5"));
        });

        it("should correctly calculate with large amounts", async function () {
            // Deposit 100 WETH = $200,000
            await weth.mint(user1.address, ethers.parseEther("100"));
            await weth.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("100"));
            await lendingPool.connect(user1).deposit(await weth.getAddress(), ethers.parseEther("100"));

            const accountData = await lendingPool.getUserAccountData(user1.address);
            expect(accountData.totalCollateralUSD).to.equal(ethers.parseEther("200000"));
            expect(accountData.availableBorrowsUSD).to.equal(ethers.parseEther("150000"));
        });
    });
});
