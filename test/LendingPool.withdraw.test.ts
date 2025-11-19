import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingPool, LARToken, InterestRateModel, MockERC20, MockV3Aggregator } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LendingPool - Withdraw", function () {
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

    const WETH_PRICE = 2000_00000000; // $2000 with 8 decimals
    const DAI_PRICE = 1_00000000; // $1 with 8 decimals
    const USDC_PRICE = 1_00000000; // $1 with 8 decimals
    const LINK_PRICE = 15_00000000; // $15 with 8 decimals

    const WETH_LTV = 7500; // 75%
    const DAI_LTV = 8000; // 80%
    const USDC_LTV = 8000; // 80%
    const LINK_LTV = 6000; // 60%

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

        // Mint test tokens to users
        await weth.mint(user1.address, ethers.parseEther("100"));
        await dai.mint(user1.address, ethers.parseEther("100000"));
        await usdc.mint(user1.address, 100000_000000);
        await link.mint(user1.address, ethers.parseEther("10000"));

        await weth.mint(user2.address, ethers.parseEther("50"));
        await dai.mint(user2.address, ethers.parseEther("50000"));
        await usdc.mint(user2.address, 50000_000000);
    });

    describe("Basic Withdraw Functionality", function () {
        it("should allow withdrawal of deposited tokens", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            await expect(
                lendingPool.connect(user1).withdraw(await weth.getAddress(), depositAmount)
            ).to.not.be.reverted;
        });

        it("should burn LAR tokens proportionally", async function () {
            const depositAmount = ethers.parseEther("1");
            const expectedLAR = ethers.parseEther("2000");

            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            const larBalanceBefore = await larToken.balanceOf(user1.address);
            await lendingPool.connect(user1).withdraw(await weth.getAddress(), depositAmount);
            const larBalanceAfter = await larToken.balanceOf(user1.address);

            expect(larBalanceBefore - larBalanceAfter).to.equal(expectedLAR);
        });

        it("should update user deposited balance correctly", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            await lendingPool.connect(user1).withdraw(await weth.getAddress(), depositAmount);

            const userReserve = await lendingPool.userReserves(user1.address, await weth.getAddress());
            expect(userReserve.deposited).to.equal(0);
        });

        it("should update total deposits correctly", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            await lendingPool.connect(user1).withdraw(await weth.getAddress(), depositAmount);

            const totalDeposits = await lendingPool.totalDeposits(await weth.getAddress());
            expect(totalDeposits).to.equal(0);
        });

        it("should transfer tokens back to user", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            const balanceBefore = await weth.balanceOf(user1.address);
            await lendingPool.connect(user1).withdraw(await weth.getAddress(), depositAmount);
            const balanceAfter = await weth.balanceOf(user1.address);

            expect(balanceAfter - balanceBefore).to.equal(depositAmount);
        });

        it("should revert if insufficient balance", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            await expect(
                lendingPool.connect(user1).withdraw(await weth.getAddress(), ethers.parseEther("2"))
            ).to.be.revertedWith("Insufficient balance");
        });

        it("should emit Withdraw event with correct parameters", async function () {
            const depositAmount = ethers.parseEther("1");
            const expectedLAR = ethers.parseEther("2000");

            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            await expect(
                lendingPool.connect(user1).withdraw(await weth.getAddress(), depositAmount)
            )
                .to.emit(lendingPool, "Withdraw")
                .withArgs(user1.address, await weth.getAddress(), depositAmount, expectedLAR);
        });
    });

    describe("Partial Withdrawals", function () {
        it("should allow partial withdrawal without loans", async function () {
            const depositAmount = ethers.parseEther("2");
            const withdrawAmount = ethers.parseEther("1");

            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            await lendingPool.connect(user1).withdraw(await weth.getAddress(), withdrawAmount);

            const userReserve = await lendingPool.userReserves(user1.address, await weth.getAddress());
            expect(userReserve.deposited).to.equal(depositAmount - withdrawAmount);
        });

        it("should burn proportional LAR for partial withdrawal", async function () {
            const depositAmount = ethers.parseEther("2");
            const withdrawAmount = ethers.parseEther("1");
            const expectedLARBurn = ethers.parseEther("2000"); // $2000 for 1 WETH

            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            const larBefore = await larToken.balanceOf(user1.address);
            await lendingPool.connect(user1).withdraw(await weth.getAddress(), withdrawAmount);
            const larAfter = await larToken.balanceOf(user1.address);

            expect(larBefore - larAfter).to.equal(expectedLARBurn);
        });
    });

    describe("Withdrawals with Active Loans", function () {
        it("should allow full withdrawal if no loans", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            await expect(
                lendingPool.connect(user1).withdraw(await weth.getAddress(), depositAmount)
            ).to.not.be.reverted;
        });

        it("should allow partial withdrawal if loans exist but health remains healthy", async function () {
            // Deposit 2 WETH as collateral
            const depositAmount = ethers.parseEther("2");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            // Provide liquidity for borrowing
            const daiLiquidity = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), daiLiquidity);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), daiLiquidity);

            // Borrow some DAI (well below max)
            const borrowAmount = ethers.parseEther("1000"); // Borrow $1000 against $4000 collateral
            await lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount);

            // Should be able to withdraw some WETH while staying healthy
            const withdrawAmount = ethers.parseEther("0.5");
            await expect(
                lendingPool.connect(user1).withdraw(await weth.getAddress(), withdrawAmount)
            ).to.not.be.reverted;
        });

        it("should revert if withdrawal would break health factor", async function () {
            // Deposit 1 WETH as collateral ($2000)
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            // Provide liquidity for borrowing
            const daiLiquidity = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), daiLiquidity);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), daiLiquidity);

            // Borrow maximum allowed: $2000 * 75% = $1500
            const borrowAmount = ethers.parseEther("1500");
            await lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount);

            // Try to withdraw any WETH - should fail
            await expect(
                lendingPool.connect(user1).withdraw(await weth.getAddress(), ethers.parseEther("0.1"))
            ).to.be.revertedWith("Withdrawal would break health factor");
        });

        it("should calculate health factor correctly with multiple collaterals", async function () {
            // Deposit WETH and DAI
            const wethAmount = ethers.parseEther("1"); // $2000
            const daiAmount = ethers.parseEther("1000"); // $1000

            await weth.connect(user1).approve(await lendingPool.getAddress(), wethAmount);
            await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), wethAmount);
            await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

            // Provide USDC liquidity
            const usdcLiquidity = 10000_000000;
            await usdc.connect(user2).approve(await lendingPool.getAddress(), usdcLiquidity);
            await lendingPool.connect(user2).deposit(await usdc.getAddress(), usdcLiquidity);

            // Borrow USDC
            // Max borrowing power = $2000 * 75% + $1000 * 80% = $1500 + $800 = $2300
            const borrowAmount = 2000_000000; // $2000
            await lendingPool.connect(user1).borrow(await usdc.getAddress(), borrowAmount);

            // Should be able to withdraw some DAI (lower value, higher LTV)
            const withdrawAmount = ethers.parseEther("100");
            await expect(
                lendingPool.connect(user1).withdraw(await dai.getAddress(), withdrawAmount)
            ).to.not.be.reverted;
        });
    });

    describe("Edge Cases and Validation", function () {
        it("should revert on zero amount withdrawal", async function () {
            await expect(
                lendingPool.connect(user1).withdraw(await weth.getAddress(), 0)
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("should revert if no deposits exist", async function () {
            await expect(
                lendingPool.connect(user1).withdraw(await weth.getAddress(), ethers.parseEther("1"))
            ).to.be.revertedWith("Insufficient balance");
        });

        it("should handle USDC withdrawal correctly (6 decimals)", async function () {
            const depositAmount = 1000_000000; // 1000 USDC
            await usdc.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await usdc.getAddress(), depositAmount);

            await lendingPool.connect(user1).withdraw(await usdc.getAddress(), depositAmount);

            const userReserve = await lendingPool.userReserves(user1.address, await usdc.getAddress());
            expect(userReserve.deposited).to.equal(0);
        });

        it("should handle withdrawal after multiple deposits", async function () {
            const deposit1 = ethers.parseEther("1");
            const deposit2 = ethers.parseEther("2");

            await weth.connect(user1).approve(await lendingPool.getAddress(), deposit1 + deposit2);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), deposit1);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), deposit2);

            await lendingPool.connect(user1).withdraw(await weth.getAddress(), deposit1 + deposit2);

            const userReserve = await lendingPool.userReserves(user1.address, await weth.getAddress());
            expect(userReserve.deposited).to.equal(0);
        });
    });

    describe("Gas Optimization", function () {
        it("should use reasonable gas for withdraw operation", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            const tx = await lendingPool.connect(user1).withdraw(await weth.getAddress(), depositAmount);
            const receipt = await tx.wait();

            expect(receipt?.gasUsed).to.be.lessThan(130000);
        });
    });
});
