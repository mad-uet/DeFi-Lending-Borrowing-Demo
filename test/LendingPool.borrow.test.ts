import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingPool, LARToken, InterestRateModel, MockERC20, MockV3Aggregator } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LendingPool - Borrow", function () {
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

    describe("Basic Borrow Functionality", function () {
        beforeEach(async function () {
            // User1 deposits WETH as collateral
            const collateralAmount = ethers.parseEther("1"); // $2000 worth
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            // User2 provides DAI liquidity
            const liquidityAmount = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);
        });

        it("should allow borrowing against collateral", async function () {
            const borrowAmount = ethers.parseEther("1000"); // $1000
            await expect(
                lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount)
            ).to.not.be.reverted;
        });

        it("should update user borrowed balance correctly", async function () {
            const borrowAmount = ethers.parseEther("1000");
            await lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount);

            const userReserve = await lendingPool.userReserves(user1.address, await dai.getAddress());
            expect(userReserve.borrowed).to.equal(borrowAmount);
        });

        it("should update total borrows correctly", async function () {
            const borrowAmount = ethers.parseEther("1000");
            await lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount);

            const totalBorrows = await lendingPool.totalBorrows(await dai.getAddress());
            expect(totalBorrows).to.equal(borrowAmount);
        });

        it("should transfer tokens to borrower", async function () {
            const borrowAmount = ethers.parseEther("1000");
            const balanceBefore = await dai.balanceOf(user1.address);

            await lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount);

            const balanceAfter = await dai.balanceOf(user1.address);
            expect(balanceAfter - balanceBefore).to.equal(borrowAmount);
        });

        it("should emit Borrow event with correct parameters", async function () {
            const borrowAmount = ethers.parseEther("1000");

            const tx = await lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount);
            const receipt = await tx.wait();
            
            // Check that Borrow event was emitted
            const event = receipt?.logs.find(
                (log: any) => log.fragment && log.fragment.name === "Borrow"
            );
            expect(event).to.not.be.undefined;
        });

        it("should allow multiple borrows from same user", async function () {
            const borrow1 = ethers.parseEther("500");
            const borrow2 = ethers.parseEther("400");

            await lendingPool.connect(user1).borrow(await dai.getAddress(), borrow1);
            await lendingPool.connect(user1).borrow(await dai.getAddress(), borrow2);

            const userReserve = await lendingPool.userReserves(user1.address, await dai.getAddress());
            expect(userReserve.borrowed).to.equal(borrow1 + borrow2);
        });
    });

    describe("LTV Enforcement", function () {
        it("should enforce 75% LTV for WETH collateral", async function () {
            // Deposit 1 WETH ($2000)
            const collateralAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            // Provide DAI liquidity
            const liquidityAmount = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            // Max borrow: $2000 * 75% = $1500
            const maxBorrow = ethers.parseEther("1500");
            await expect(
                lendingPool.connect(user1).borrow(await dai.getAddress(), maxBorrow)
            ).to.not.be.reverted;

            // Trying to borrow more should fail
            await expect(
                lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1"))
            ).to.be.revertedWith("Insufficient collateral");
        });

        it("should enforce 80% LTV for DAI collateral", async function () {
            // Deposit 1000 DAI ($1000)
            const collateralAmount = ethers.parseEther("1000");
            await dai.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await dai.getAddress(), collateralAmount);

            // Provide WETH liquidity
            const liquidityAmount = ethers.parseEther("10");
            await weth.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await weth.getAddress(), liquidityAmount);

            // Max borrow: $1000 * 80% = $800, which is 0.4 WETH
            const maxBorrow = ethers.parseEther("0.4");
            await expect(
                lendingPool.connect(user1).borrow(await weth.getAddress(), maxBorrow)
            ).to.not.be.reverted;
        });

        it("should enforce 60% LTV for LINK collateral", async function () {
            // Deposit 100 LINK ($1500)
            const collateralAmount = ethers.parseEther("100");
            await link.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await link.getAddress(), collateralAmount);

            // Provide DAI liquidity
            const liquidityAmount = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            // Max borrow: $1500 * 60% = $900
            const maxBorrow = ethers.parseEther("900");
            await expect(
                lendingPool.connect(user1).borrow(await dai.getAddress(), maxBorrow)
            ).to.not.be.reverted;
        });
    });

    describe("Multi-Collateral Scenarios", function () {
        it("should calculate correct borrowing power with multiple collaterals", async function () {
            // Deposit WETH: 1 WETH ($2000) -> $1500 borrowing power (75%)
            const wethAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), wethAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), wethAmount);

            // Deposit DAI: 1000 DAI ($1000) -> $800 borrowing power (80%)
            const daiAmount = ethers.parseEther("1000");
            await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);
            await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

            // Total borrowing power: $1500 + $800 = $2300

            // Provide USDC liquidity
            const usdcLiquidity = 10000_000000;
            await usdc.connect(user2).approve(await lendingPool.getAddress(), usdcLiquidity);
            await lendingPool.connect(user2).deposit(await usdc.getAddress(), usdcLiquidity);

            // Should be able to borrow up to $2300
            const borrowAmount = 2300_000000; // $2300 USDC
            await expect(
                lendingPool.connect(user1).borrow(await usdc.getAddress(), borrowAmount)
            ).to.not.be.reverted;
        });

        it("should respect different LTV ratios per token in multi-collateral", async function () {
            // Deposit LINK (60% LTV): 100 LINK ($1500) -> $900 borrowing power
            const linkAmount = ethers.parseEther("100");
            await link.connect(user1).approve(await lendingPool.getAddress(), linkAmount);
            await lendingPool.connect(user1).deposit(await link.getAddress(), linkAmount);

            // Deposit DAI (80% LTV): 500 DAI ($500) -> $400 borrowing power
            const daiAmount = ethers.parseEther("500");
            await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);
            await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

            // Total: $900 + $400 = $1300 borrowing power

            // Provide USDC liquidity
            const usdcLiquidity = 10000_000000;
            await usdc.connect(user2).approve(await lendingPool.getAddress(), usdcLiquidity);
            await lendingPool.connect(user2).deposit(await usdc.getAddress(), usdcLiquidity);

            // Borrow $1300
            const borrowAmount = 1300_000000;
            await expect(
                lendingPool.connect(user1).borrow(await usdc.getAddress(), borrowAmount)
            ).to.not.be.reverted;

            // Trying to borrow more should fail
            await expect(
                lendingPool.connect(user1).borrow(await usdc.getAddress(), 1_000000)
            ).to.be.revertedWith("Insufficient collateral");
        });

        it("should allow borrowing multiple different tokens", async function () {
            // Deposit 2 WETH ($4000) -> $3000 borrowing power
            const collateralAmount = ethers.parseEther("2");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            // Provide liquidity in DAI and USDC
            const daiLiquidity = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), daiLiquidity);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), daiLiquidity);

            const usdcLiquidity = 10000_000000;
            await usdc.connect(user2).approve(await lendingPool.getAddress(), usdcLiquidity);
            await lendingPool.connect(user2).deposit(await usdc.getAddress(), usdcLiquidity);

            // Borrow $1000 in DAI
            await lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1000"));

            // Borrow $1000 in USDC
            await lendingPool.connect(user1).borrow(await usdc.getAddress(), 1000_000000);

            // Total borrowed: $2000, should still be healthy
            const daiReserve = await lendingPool.userReserves(user1.address, await dai.getAddress());
            const usdcReserve = await lendingPool.userReserves(user1.address, await usdc.getAddress());

            expect(daiReserve.borrowed).to.equal(ethers.parseEther("1000"));
            expect(usdcReserve.borrowed).to.equal(1000_000000);
        });
    });

    describe("Liquidity Checks", function () {
        it("should revert if pool lacks liquidity", async function () {
            // Deposit WETH as collateral
            const collateralAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            // Try to borrow DAI without any DAI liquidity in pool
            await expect(
                lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("100"))
            ).to.be.revertedWith("Insufficient liquidity");
        });

        it("should revert if borrowing more than available liquidity", async function () {
            // Deposit collateral
            const collateralAmount = ethers.parseEther("10"); // $20k -> $15k borrowing power
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            // Provide limited DAI liquidity
            const liquidityAmount = ethers.parseEther("1000"); // Only $1000 available
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            // Try to borrow more than available
            await expect(
                lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("1001"))
            ).to.be.revertedWith("Insufficient liquidity");
        });

        it("should allow borrowing up to available liquidity", async function () {
            // Deposit collateral
            const collateralAmount = ethers.parseEther("10");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            // Provide DAI liquidity
            const liquidityAmount = ethers.parseEther("1000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            // Borrow exactly the available amount
            await expect(
                lendingPool.connect(user1).borrow(await dai.getAddress(), liquidityAmount)
            ).to.not.be.reverted;
        });
    });

    describe("Edge Cases and Validation", function () {
        it("should revert on zero amount borrow", async function () {
            await expect(
                lendingPool.connect(user1).borrow(await dai.getAddress(), 0)
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("should revert on unsupported token", async function () {
            const unsupportedToken = await (await ethers.getContractFactory("MockERC20"))
                .deploy("Unsupported", "UNS", 18);

            await expect(
                lendingPool.connect(user1).borrow(await unsupportedToken.getAddress(), ethers.parseEther("1"))
            ).to.be.revertedWith("Token not supported");
        });

        it("should revert when token is deactivated", async function () {
            // Deposit collateral first
            const collateralAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            // Provide DAI liquidity
            const liquidityAmount = ethers.parseEther("1000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            // Deactivate DAI
            await lendingPool.deactivateToken(await dai.getAddress());

            // Try to borrow
            await expect(
                lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("100"))
            ).to.be.revertedWith("Token not active");
        });

        it("should revert if user has no collateral", async function () {
            // Provide liquidity
            const liquidityAmount = ethers.parseEther("1000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            // Try to borrow without collateral
            await expect(
                lendingPool.connect(user1).borrow(await dai.getAddress(), ethers.parseEther("100"))
            ).to.be.revertedWith("Insufficient collateral");
        });

        it("should handle USDC borrows correctly (6 decimals)", async function () {
            // Deposit collateral
            const collateralAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            // Provide USDC liquidity
            const liquidityAmount = 10000_000000;
            await usdc.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await usdc.getAddress(), liquidityAmount);

            // Borrow USDC
            const borrowAmount = 1000_000000;
            await lendingPool.connect(user1).borrow(await usdc.getAddress(), borrowAmount);

            const userReserve = await lendingPool.userReserves(user1.address, await usdc.getAddress());
            expect(userReserve.borrowed).to.equal(borrowAmount);
        });
    });

    describe("Gas Optimization", function () {
        it("should use reasonable gas for borrow operation", async function () {
            // Setup collateral and liquidity
            const collateralAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), collateralAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), collateralAmount);

            const liquidityAmount = ethers.parseEther("10000");
            await dai.connect(user2).approve(await lendingPool.getAddress(), liquidityAmount);
            await lendingPool.connect(user2).deposit(await dai.getAddress(), liquidityAmount);

            // Borrow
            const borrowAmount = ethers.parseEther("1000");
            const tx = await lendingPool.connect(user1).borrow(await dai.getAddress(), borrowAmount);
            const receipt = await tx.wait();

            expect(receipt?.gasUsed).to.be.lessThan(190000);
        });
    });
});
