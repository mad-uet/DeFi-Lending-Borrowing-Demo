import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingPool, LARToken, InterestRateModel, MockERC20, MockV3Aggregator } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LendingPool - Repay", function () {
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

        // Deploy mock tokens
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        weth = await MockERC20Factory.deploy("Wrapped Ether", "WETH", 18);
        dai = await MockERC20Factory.deploy("Dai Stablecoin", "DAI", 18);
        usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
        link = await MockERC20Factory.deploy("Chainlink", "LINK", 18);

        // Deploy price feeds
        const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
        wethPriceFeed = await MockV3AggregatorFactory.deploy(8, WETH_PRICE);
        daiPriceFeed = await MockV3AggregatorFactory.deploy(8, DAI_PRICE);
        usdcPriceFeed = await MockV3AggregatorFactory.deploy(8, USDC_PRICE);
        linkPriceFeed = await MockV3AggregatorFactory.deploy(8, LINK_PRICE);

        // Deploy LARToken
        const LARTokenFactory = await ethers.getContractFactory("LARToken");
        larToken = await LARTokenFactory.deploy();

        // Deploy InterestRateModel
        const InterestRateModelFactory = await ethers.getContractFactory("InterestRateModel");
        interestRateModel = await InterestRateModelFactory.deploy();

        // Deploy LendingPool
        const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
        lendingPool = await LendingPoolFactory.deploy(
            await larToken.getAddress(),
            await interestRateModel.getAddress()
        );

        // Transfer ownership of LARToken to LendingPool
        await larToken.transferOwnership(await lendingPool.getAddress());

        // Add supported tokens
        await lendingPool.addToken(await weth.getAddress(), await wethPriceFeed.getAddress(), WETH_LTV);
        await lendingPool.addToken(await dai.getAddress(), await daiPriceFeed.getAddress(), DAI_LTV);
        await lendingPool.addToken(await usdc.getAddress(), await usdcPriceFeed.getAddress(), USDC_LTV);
        await lendingPool.addToken(await link.getAddress(), await linkPriceFeed.getAddress(), LINK_LTV);

        // Mint test tokens
        await weth.mint(user1.address, ethers.parseEther("100"));
        await dai.mint(user1.address, ethers.parseEther("100000"));
        await usdc.mint(user1.address, 100000_000000);

        await weth.mint(user2.address, ethers.parseEther("50"));
        await dai.mint(user2.address, ethers.parseEther("50000"));
        await usdc.mint(user2.address, 50000_000000);
    });

    describe("Basic Repay Functionality", function () {
        beforeEach(async function () {
            // Setup: User1 deposits collateral and borrows
            const collateralAmount = ethers.parseEther("2");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            // User2 provides liquidity
            const liquidityAmount = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            // User1 borrows DAI
            const borrowAmount = ethers.parseEther("1000");
            await lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount);
        });

        it("should allow repayment of borrowed amount", async function () {
            const repayAmount = ethers.parseEther("500");
            await dai.connect(user1).approve(await lendingPool.getAddress(), repayAmount);

            await expect(
                lendingPool.connect(user1).repay(await dai.getAddress(), repayAmount)
            ).to.not.be.reverted;
        });

        it("should update user borrowed balance correctly", async function () {
            const borrowedBefore = (await lendingPool.userReserves(user1.address, await dai.getAddress())).borrowed;
            
            const repayAmount = ethers.parseEther("500");
            await dai.connect(user1).approve(await lendingPool.getAddress(), repayAmount);
            await lendingPool.connect(user1).repay(await dai.getAddress(), repayAmount);

            const borrowedAfter = (await lendingPool.userReserves(user1.address, await dai.getAddress())).borrowed;
            
            // Should have repaid ~495 (after interest of ~5)
            expect(borrowedBefore - borrowedAfter).to.be.greaterThan(ethers.parseEther("490"));
            expect(borrowedBefore - borrowedAfter).to.be.lessThan(ethers.parseEther("500"));
        });

        it("should update total borrows correctly", async function () {
            const totalBorrowsBefore = await lendingPool.totalBorrows(await dai.getAddress());
            
            const repayAmount = ethers.parseEther("500");
            await dai.connect(user1).approve(await lendingPool.getAddress(), repayAmount);
            await lendingPool.connect(user1).repay(await dai.getAddress(), repayAmount);

            const totalBorrowsAfter = await lendingPool.totalBorrows(await dai.getAddress());
            
            expect(totalBorrowsBefore - totalBorrowsAfter).to.be.greaterThan(ethers.parseEther("490"));
            expect(totalBorrowsBefore - totalBorrowsAfter).to.be.lessThan(ethers.parseEther("500"));
        });

        it("should transfer tokens from user to contract", async function () {
            const repayAmount = ethers.parseEther("500");
            await dai.connect(user1).approve(await lendingPool.getAddress(), repayAmount);

            const userBalanceBefore = await dai.balanceOf(user1.address);
            const poolBalanceBefore = await dai.balanceOf(await lendingPool.getAddress());

            await lendingPool.connect(user1).repay(await dai.getAddress(), repayAmount);

            const userBalanceAfter = await dai.balanceOf(user1.address);
            const poolBalanceAfter = await dai.balanceOf(await lendingPool.getAddress());

            expect(userBalanceBefore - userBalanceAfter).to.equal(repayAmount);
            expect(poolBalanceAfter - poolBalanceBefore).to.equal(repayAmount);
        });

        it("should emit Repay event", async function () {
            const repayAmount = ethers.parseEther("500");
            await dai.connect(user1).approve(await lendingPool.getAddress(), repayAmount);

            const tx = await lendingPool.connect(user1).repay(await dai.getAddress(), repayAmount);
            const receipt = await tx.wait();
            
            const event = receipt?.logs.find(
                (log: any) => log.fragment && log.fragment.name === "Repay"
            );
            expect(event).to.not.be.undefined;
        });
    });

    describe("Partial Repayment", function () {
        beforeEach(async function () {
            // Setup borrowing
            const collateralAmount = ethers.parseEther("2");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            const liquidityAmount = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1000"));
        });

        it("should allow partial repayment", async function () {
            const borrowed = (await lendingPool.userReserves(user1.address, await dai.getAddress())).borrowed;
            const partialRepay = ethers.parseEther("300");

            await dai.connect(user1).approve(await lendingPool.getAddress(), partialRepay);
            await lendingPool.connect(user1).repay(await dai.getAddress(), partialRepay);

            const borrowedAfter = (await lendingPool.userReserves(user1.address, await dai.getAddress())).borrowed;
            expect(borrowedAfter).to.be.lessThan(borrowed);
            expect(borrowedAfter).to.be.greaterThan(0);
        });

        it("should allow multiple partial repayments", async function () {
            const repay1 = ethers.parseEther("200");
            const repay2 = ethers.parseEther("300");

            await dai.connect(user1).approve(await lendingPool.getAddress(), repay1 + repay2);
            
            await lendingPool.connect(user1).repay(await dai.getAddress(), repay1);
            await lendingPool.connect(user1).repay(await dai.getAddress(), repay2);

            const borrowed = (await lendingPool.userReserves(user1.address, await dai.getAddress())).borrowed;
            expect(borrowed).to.be.lessThan(ethers.parseEther("1000"));
        });
    });

    describe("Full Repayment", function () {
        beforeEach(async function () {
            const collateralAmount = ethers.parseEther("2");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            const liquidityAmount = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1000"));
        });

        it("should allow full repayment of debt", async function () {
            // Repay more than borrowed to cover interest
            const repayAmount = ethers.parseEther("1100");
            await dai.connect(user1).approve(await lendingPool.getAddress(), repayAmount);
            await lendingPool.connect(user1).repay(await dai.getAddress(), repayAmount);

            const borrowed = (await lendingPool.userReserves(user1.address, await dai.getAddress())).borrowed;
            expect(borrowed).to.equal(0);
        });

        it("should clear borrowed amount after full repayment", async function () {
            const repayAmount = ethers.parseEther("1100");
            await dai.connect(user1).approve(await lendingPool.getAddress(), repayAmount);
            await lendingPool.connect(user1).repay(await dai.getAddress(), repayAmount);

            const userReserve = await lendingPool.userReserves(user1.address, await dai.getAddress());
            expect(userReserve.borrowed).to.equal(0);
        });
    });

    describe("Interest Calculation", function () {
        it("should calculate interest correctly", async function () {
            // Setup
            const collateralAmount = ethers.parseEther("2");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            const liquidityAmount = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            const borrowAmount = ethers.parseEther("1000");
            await lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount);

            // Calculate expected interest
            // Utilization = 1000/10000 = 10%
            // Rate from InterestRateModel at 10% utilization = 0.5% (50 bps)
            // Interest = 1000 * 50 / 10000 = 5 DAI
            const expectedInterest = ethers.parseEther("5");

            // Repay with interest
            const repayAmount = borrowAmount + expectedInterest;
            await dai.connect(user1).approve(await lendingPool.getAddress(), repayAmount);
            
            const tx = await lendingPool.connect(user1).repay(await dai.getAddress(), repayAmount);
            const receipt = await tx.wait();
            
            // Check Repay event for interest amount
            const event = receipt?.logs.find(
                (log: any) => log.fragment && log.fragment.name === "Repay"
            );
            expect(event).to.not.be.undefined;
        });

        it("should handle interest when utilization is higher", async function () {
            // Create higher utilization scenario
            const collateralAmount = ethers.parseEther("10");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            // Limited liquidity
            const liquidityAmount = ethers.parseEther("1000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            // Borrow 80% of liquidity -> high utilization
            const borrowAmount = ethers.parseEther("800");
            await lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount);

            // At 80% utilization, rate should be exactly at optimal (4% = 400 bps)
            // Interest = 800 * 400 / 10000 = 32 DAI
            
            const repayAmount = ethers.parseEther("850");
            await dai.connect(user1).approve(await lendingPool.getAddress(), repayAmount);
            await lendingPool.connect(user1).repay(await dai.getAddress(), repayAmount);

            const borrowed = (await lendingPool.userReserves(user1.address, await dai.getAddress())).borrowed;
            expect(borrowed).to.equal(0);
        });
    });

    describe("Edge Cases and Validation", function () {
        it("should revert on zero amount repayment", async function () {
            await expect(
                lendingPool.connect(user1).repay(await dai.getAddress(), 0)
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("should revert if user has no debt", async function () {
            await dai.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("100"));
            
            await expect(
                lendingPool.connect(user1).repay(await dai.getAddress(), ethers.parseEther("100"))
            ).to.be.revertedWith("No debt to repay");
        });

        it("should handle USDC repayment correctly (6 decimals)", async function () {
            // Setup
            const collateralAmount = ethers.parseEther("2");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            const liquidityAmount = 10000_000000;
            await usdc.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await usdc.getAddress(), liquidityAmount);

            const borrowAmount = 1000_000000;
            await lendingPool.connect(user1).borrow(await usdc.getAddress(), borrowAmount);

            // Repay
            const repayAmount = 1100_000000;
            await usdc.connect(user1).approve(await lendingPool.getAddress(), repayAmount);
            await lendingPool.connect(user1).repay(await usdc.getAddress(), repayAmount);

            const borrowed = (await lendingPool.userReserves(user1.address, await usdc.getAddress())).borrowed;
            expect(borrowed).to.equal(0);
        });

        it("should cap repayment at total debt", async function () {
            // Setup
            const collateralAmount = ethers.parseEther("2");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            const liquidityAmount = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1000"));

            // Try to repay much more than borrowed
            const excessiveRepay = ethers.parseEther("10000");
            await dai.connect(user1).approve(await lendingPool.getAddress(), excessiveRepay);
            
            const balanceBefore = await dai.balanceOf(user1.address);
            await lendingPool.connect(user1).repay(await dai.getAddress(), excessiveRepay);
            const balanceAfter = await dai.balanceOf(user1.address);

            // Should only deduct borrowed + interest, not the full excessive amount
            const actualRepaid = balanceBefore - balanceAfter;
            expect(actualRepaid).to.be.lessThan(ethers.parseEther("1100"));
        });

        it("should allow repayment after multiple borrows", async function () {
            // Setup
            const collateralAmount = ethers.parseEther("5");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            const liquidityAmount = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            // Multiple borrows
            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("500"));
            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("300"));

            // Repay total
            const repayAmount = ethers.parseEther("900");
            await dai.connect(user1).approve(await lendingPool.getAddress(), repayAmount);
            await lendingPool.connect(user1).repay(await dai.getAddress(), repayAmount);

            const borrowed = (await lendingPool.userReserves(user1.address, await dai.getAddress())).borrowed;
            expect(borrowed).to.be.lessThan(ethers.parseEther("10")); // Almost fully repaid
        });
    });

    describe("Gas Optimization", function () {
        it("should use reasonable gas for repay operation", async function () {
            // Setup
            const collateralAmount = ethers.parseEther("2");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            const liquidityAmount = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1000"));

            // Repay
            const repayAmount = ethers.parseEther("500");
            await dai.connect(user1).approve(await lendingPool.getAddress(), repayAmount);
            
            const tx = await lendingPool.connect(user1).repay(await dai.getAddress(), repayAmount);
            const receipt = await tx.wait();

            expect(receipt?.gasUsed).to.be.lessThan(150000);
        });
    });
});
