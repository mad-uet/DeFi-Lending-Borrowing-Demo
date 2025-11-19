import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingPool, LARToken, InterestRateModel, MockERC20, MockV3Aggregator, PriceOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LendingPool - Deposit", function () {
    let lendingPool: LendingPool;
    let larToken: LARToken;
    let interestRateModel: InterestRateModel;
    let priceOracle: PriceOracle;
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

        // Deploy PriceOracle
        const PriceOracleFactory = await ethers.getContractFactory("PriceOracle");
        priceOracle = await PriceOracleFactory.deploy();

        // Set price feeds in PriceOracle
        await priceOracle.setPriceFeed(await weth.getAddress(), await wethPriceFeed.getAddress());
        await priceOracle.setPriceFeed(await dai.getAddress(), await daiPriceFeed.getAddress());
        await priceOracle.setPriceFeed(await usdc.getAddress(), await usdcPriceFeed.getAddress());
        await priceOracle.setPriceFeed(await link.getAddress(), await linkPriceFeed.getAddress());

        // Deploy LendingPool
        const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
        lendingPool = await LendingPoolFactory.deploy(
            await larToken.getAddress(),
            await interestRateModel.getAddress(),
            await priceOracle.getAddress()
        );

        // Transfer ownership of LARToken to LendingPool
        await larToken.transferOwnership(await lendingPool.getAddress());

        // Add supported tokens (no price feeds - handled by PriceOracle)
        await lendingPool.addToken(await weth.getAddress(), WETH_LTV);
        await lendingPool.addToken(await dai.getAddress(), DAI_LTV);
        await lendingPool.addToken(await usdc.getAddress(), USDC_LTV);
        await lendingPool.addToken(await link.getAddress(), LINK_LTV);

        // Mint test tokens to users
        await weth.mint(user1.address, ethers.parseEther("100"));
        await dai.mint(user1.address, ethers.parseEther("100000"));
        await usdc.mint(user1.address, 100000_000000); // 100k USDC (6 decimals)
        await link.mint(user1.address, ethers.parseEther("10000"));

        await weth.mint(user2.address, ethers.parseEther("50"));
        await dai.mint(user2.address, ethers.parseEther("50000"));
    });

    describe("Basic Deposit Functionality", function () {
        it("should allow deposit of supported token", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);

            await expect(lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount))
                .to.not.be.reverted;
        });

        it("should update user deposited balance correctly", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            const userReserve = await lendingPool.userReserves(user1.address, await weth.getAddress());
            expect(userReserve.deposited).to.equal(depositAmount);
        });

        it("should update total deposits correctly", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            const totalDeposits = await lendingPool.totalDeposits(await weth.getAddress());
            expect(totalDeposits).to.equal(depositAmount);
        });

        it("should mint LAR rewards based on USD value (1:1)", async function () {
            const depositAmount = ethers.parseEther("1"); // 1 WETH
            // USD value = 1 * $2000 = $2000
            // Expected LAR = 2000 tokens
            const expectedLAR = ethers.parseEther("2000");

            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            
            const balanceBefore = await larToken.balanceOf(user1.address);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);
            const balanceAfter = await larToken.balanceOf(user1.address);

            expect(balanceAfter - balanceBefore).to.equal(expectedLAR);
        });

        it("should revert on unsupported token", async function () {
            const unsupportedToken = await (await ethers.getContractFactory("MockERC20"))
                .deploy("Unsupported", "UNS", 18);
            
            const depositAmount = ethers.parseEther("1");
            await unsupportedToken.mint(user1.address, depositAmount);
            await unsupportedToken.connect(user1).approve(await lendingPool.getAddress(), depositAmount);

            await expect(
                lendingPool.connect(user1).deposit(await unsupportedToken.getAddress(), depositAmount)
            ).to.be.revertedWith("Token not supported");
        });

        it("should revert without token approval", async function () {
            const depositAmount = ethers.parseEther("1");
            // No approval given

            await expect(
                lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount)
            ).to.be.reverted;
        });

        it("should handle multiple deposits from same user", async function () {
            const deposit1 = ethers.parseEther("1");
            const deposit2 = ethers.parseEther("2");

            await weth.connect(user1).approve(await lendingPool.getAddress(), deposit1 + deposit2);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), deposit1);
            await lendingPool.connect(user1).deposit(await weth.getAddress(), deposit2);

            const userReserve = await lendingPool.userReserves(user1.address, await weth.getAddress());
            expect(userReserve.deposited).to.equal(deposit1 + deposit2);
        });

        it("should emit Deposit event with correct parameters", async function () {
            const depositAmount = ethers.parseEther("1");
            const expectedLAR = ethers.parseEther("2000");

            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);

            await expect(lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount))
                .to.emit(lendingPool, "Deposit")
                .withArgs(user1.address, await weth.getAddress(), depositAmount, expectedLAR);
        });

        it("should transfer tokens from user to contract", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);

            const userBalanceBefore = await weth.balanceOf(user1.address);
            const poolBalanceBefore = await weth.balanceOf(await lendingPool.getAddress());

            await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);

            const userBalanceAfter = await weth.balanceOf(user1.address);
            const poolBalanceAfter = await weth.balanceOf(await lendingPool.getAddress());

            expect(userBalanceBefore - userBalanceAfter).to.equal(depositAmount);
            expect(poolBalanceAfter - poolBalanceBefore).to.equal(depositAmount);
        });
    });

    describe("Multiple Token Deposits", function () {
        it("should handle deposits of different tokens independently", async function () {
            const wethAmount = ethers.parseEther("1");
            const daiAmount = ethers.parseEther("1000");

            await weth.connect(user1).approve(await lendingPool.getAddress(), wethAmount);
            await dai.connect(user1).approve(await lendingPool.getAddress(), daiAmount);

            await lendingPool.connect(user1).deposit(await weth.getAddress(), wethAmount);
            await lendingPool.connect(user1).deposit(await dai.getAddress(), daiAmount);

            const wethReserve = await lendingPool.userReserves(user1.address, await weth.getAddress());
            const daiReserve = await lendingPool.userReserves(user1.address, await dai.getAddress());

            expect(wethReserve.deposited).to.equal(wethAmount);
            expect(daiReserve.deposited).to.equal(daiAmount);
        });

        it("should mint correct LAR for USDC deposits (6 decimals)", async function () {
            const depositAmount = 1000_000000; // 1000 USDC (6 decimals)
            // USD value = $1000
            // Expected LAR = 1000 tokens (18 decimals)
            const expectedLAR = ethers.parseEther("1000");

            await usdc.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            
            const balanceBefore = await larToken.balanceOf(user1.address);
            await lendingPool.connect(user1).deposit(await usdc.getAddress(), depositAmount);
            const balanceAfter = await larToken.balanceOf(user1.address);

            expect(balanceAfter - balanceBefore).to.equal(expectedLAR);
        });

        it("should accumulate total deposits across multiple users", async function () {
            const user1Amount = ethers.parseEther("1");
            const user2Amount = ethers.parseEther("2");

            await weth.connect(user1).approve(await lendingPool.getAddress(), user1Amount);
            await weth.connect(user2).approve(await lendingPool.getAddress(), user2Amount);

            await lendingPool.connect(user1).deposit(await weth.getAddress(), user1Amount);
            await lendingPool.connect(user2).deposit(await weth.getAddress(), user2Amount);

            const totalDeposits = await lendingPool.totalDeposits(await weth.getAddress());
            expect(totalDeposits).to.equal(user1Amount + user2Amount);
        });
    });

    describe("Edge Cases and Validation", function () {
        it("should revert on zero amount deposit", async function () {
            await expect(
                lendingPool.connect(user1).deposit(await weth.getAddress(), 0)
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("should handle deposits when token is deactivated", async function () {
            const depositAmount = ethers.parseEther("1");
            
            // Deactivate token
            await lendingPool.deactivateToken(await weth.getAddress());

            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            
            await expect(
                lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount)
            ).to.be.revertedWith("Token not active");
        });

        it("should deposit maximum uint256 amount correctly", async function () {
            // This tests overflow protection
            const largeAmount = ethers.parseEther("1000");
            await weth.mint(user1.address, largeAmount);
            await weth.connect(user1).approve(await lendingPool.getAddress(), largeAmount);

            await expect(
                lendingPool.connect(user1).deposit(await weth.getAddress(), largeAmount)
            ).to.not.be.reverted;
        });

        it("should correctly calculate LAR for LINK deposits", async function () {
            const depositAmount = ethers.parseEther("100"); // 100 LINK
            // USD value = 100 * $15 = $1500
            const expectedLAR = ethers.parseEther("1500");

            await link.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
            
            const balanceBefore = await larToken.balanceOf(user1.address);
            await lendingPool.connect(user1).deposit(await link.getAddress(), depositAmount);
            const balanceAfter = await larToken.balanceOf(user1.address);

            expect(balanceAfter - balanceBefore).to.equal(expectedLAR);
        });
    });

    describe("Gas Optimization", function () {
        it("should use reasonable gas for deposit operation", async function () {
            const depositAmount = ethers.parseEther("1");
            await weth.connect(user1).approve(await lendingPool.getAddress(), depositAmount);

            const tx = await lendingPool.connect(user1).deposit(await weth.getAddress(), depositAmount);
            const receipt = await tx.wait();
            
            expect(receipt?.gasUsed).to.be.lessThan(165000);
        });
    });
});
