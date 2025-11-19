import { expect } from "chai";
import { ethers } from "hardhat";
import { PriceOracle, MockV3Aggregator } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("PriceOracle", function () {
    let priceOracle: PriceOracle;
    let mockPriceFeed: MockV3Aggregator;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    const INITIAL_PRICE = 2000_00000000; // $2000 with 8 decimals
    const PRICE_DECIMALS = 8;
    const TOKEN_ADDRESS = "0x0000000000000000000000000000000000000001";

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy PriceOracle
        const PriceOracleFactory = await ethers.getContractFactory("PriceOracle");
        priceOracle = await PriceOracleFactory.deploy();

        // Deploy mock price feed
        const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
        mockPriceFeed = await MockV3AggregatorFactory.deploy(PRICE_DECIMALS, INITIAL_PRICE);
    });

    describe("Deployment", function () {
        it("Should deploy with correct owner", async function () {
            expect(await priceOracle.owner()).to.equal(owner.address);
        });

        it("Should set correct PRICE_TIMEOUT constant", async function () {
            expect(await priceOracle.PRICE_TIMEOUT()).to.equal(3600); // 1 hour in seconds
        });
    });

    describe("setPriceFeed", function () {
        it("Should allow owner to set price feeds", async function () {
            await priceOracle.setPriceFeed(TOKEN_ADDRESS, await mockPriceFeed.getAddress());
            expect(await priceOracle.priceFeed(TOKEN_ADDRESS)).to.equal(await mockPriceFeed.getAddress());
        });

        it("Should revert if non-owner tries to set price feeds", async function () {
            await expect(
                priceOracle.connect(user1).setPriceFeed(TOKEN_ADDRESS, await mockPriceFeed.getAddress())
            ).to.be.revertedWithCustomError(priceOracle, "OwnableUnauthorizedAccount");
        });

        it("Should revert if feed address is zero", async function () {
            await expect(
                priceOracle.setPriceFeed(TOKEN_ADDRESS, ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid feed address");
        });

        it("Should revert if token address is zero", async function () {
            await expect(
                priceOracle.setPriceFeed(ethers.ZeroAddress, await mockPriceFeed.getAddress())
            ).to.be.revertedWith("Invalid token address");
        });

        it("Should emit PriceFeedUpdated event", async function () {
            await expect(
                priceOracle.setPriceFeed(TOKEN_ADDRESS, await mockPriceFeed.getAddress())
            )
                .to.emit(priceOracle, "PriceFeedUpdated")
                .withArgs(TOKEN_ADDRESS, await mockPriceFeed.getAddress());
        });

        it("Should allow updating existing price feed", async function () {
            await priceOracle.setPriceFeed(TOKEN_ADDRESS, await mockPriceFeed.getAddress());
            
            const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
            const newPriceFeed = await MockV3AggregatorFactory.deploy(PRICE_DECIMALS, INITIAL_PRICE);
            
            await priceOracle.setPriceFeed(TOKEN_ADDRESS, await newPriceFeed.getAddress());
            expect(await priceOracle.priceFeed(TOKEN_ADDRESS)).to.equal(await newPriceFeed.getAddress());
        });
    });

    describe("getPrice", function () {
        beforeEach(async function () {
            await priceOracle.setPriceFeed(TOKEN_ADDRESS, await mockPriceFeed.getAddress());
        });

        it("Should fetch correct price for valid token", async function () {
            const price = await priceOracle.getPrice(TOKEN_ADDRESS);
            // Price should be normalized to 18 decimals
            // $2000 with 8 decimals -> 2000 * 10^18
            expect(price).to.equal(ethers.parseEther("2000"));
        });

        it("Should return prices normalized to 18 decimals", async function () {
            const price = await priceOracle.getPrice(TOKEN_ADDRESS);
            // Original: 2000_00000000 (8 decimals)
            // Expected: 2000 * 10^18 (18 decimals)
            expect(price).to.equal(BigInt(2000_00000000) * BigInt(10 ** 10));
        });

        it("Should revert on non-existent price feed", async function () {
            const unknownToken = "0x0000000000000000000000000000000000000002";
            await expect(
                priceOracle.getPrice(unknownToken)
            ).to.be.revertedWith("Price feed not set");
        });

        it("Should revert on zero price", async function () {
            await mockPriceFeed.updateAnswer(0);
            await expect(
                priceOracle.getPrice(TOKEN_ADDRESS)
            ).to.be.revertedWith("Invalid price");
        });

        it("Should revert on negative price", async function () {
            await mockPriceFeed.updateAnswer(-100);
            await expect(
                priceOracle.getPrice(TOKEN_ADDRESS)
            ).to.be.revertedWith("Invalid price");
        });

        it("Should revert on stale price (older than 1 hour)", async function () {
            // Fast forward time by more than 1 hour
            await time.increase(3601);
            
            await expect(
                priceOracle.getPrice(TOKEN_ADDRESS)
            ).to.be.revertedWith("Stale price");
        });

        it("Should accept fresh price after time increase", async function () {
            // Fast forward time
            await time.increase(3599);
            
            // Update the mock to set a new timestamp
            await mockPriceFeed.updateAnswer(INITIAL_PRICE);
            
            const price = await priceOracle.getPrice(TOKEN_ADDRESS);
            expect(price).to.equal(ethers.parseEther("2000"));
        });

        it("Should handle different price decimals correctly", async function () {
            // Deploy price feed with 18 decimals
            const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
            const priceFeed18 = await MockV3AggregatorFactory.deploy(18, ethers.parseEther("2000"));
            
            const token2 = "0x0000000000000000000000000000000000000003";
            await priceOracle.setPriceFeed(token2, await priceFeed18.getAddress());
            
            const price = await priceOracle.getPrice(token2);
            expect(price).to.equal(ethers.parseEther("2000"));
        });

        it("Should handle price feed with 6 decimals", async function () {
            // Deploy USDC-like price feed with 6 decimals
            const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
            const priceFeed6 = await MockV3AggregatorFactory.deploy(6, 1_000000); // $1 with 6 decimals
            
            const token3 = "0x0000000000000000000000000000000000000004";
            await priceOracle.setPriceFeed(token3, await priceFeed6.getAddress());
            
            const price = await priceOracle.getPrice(token3);
            // $1 with 6 decimals -> 1 * 10^18
            expect(price).to.equal(ethers.parseEther("1"));
        });
    });

    describe("getPriceWithDecimals", function () {
        beforeEach(async function () {
            await priceOracle.setPriceFeed(TOKEN_ADDRESS, await mockPriceFeed.getAddress());
        });

        it("Should return price and decimals separately", async function () {
            const [price, decimals] = await priceOracle.getPriceWithDecimals(TOKEN_ADDRESS);
            expect(price).to.equal(ethers.parseEther("2000"));
            expect(decimals).to.equal(8);
        });

        it("Should return correct decimals for different feeds", async function () {
            const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
            const priceFeed18 = await MockV3AggregatorFactory.deploy(18, ethers.parseEther("1500"));
            
            const token2 = "0x0000000000000000000000000000000000000003";
            await priceOracle.setPriceFeed(token2, await priceFeed18.getAddress());
            
            const [price, decimals] = await priceOracle.getPriceWithDecimals(token2);
            expect(price).to.equal(ethers.parseEther("1500"));
            expect(decimals).to.equal(18);
        });

        it("Should revert on stale price", async function () {
            await time.increase(3601);
            
            await expect(
                priceOracle.getPriceWithDecimals(TOKEN_ADDRESS)
            ).to.be.revertedWith("Stale price");
        });
    });

    describe("Gas Optimization", function () {
        beforeEach(async function () {
            await priceOracle.setPriceFeed(TOKEN_ADDRESS, await mockPriceFeed.getAddress());
        });

        it("Should consume less than 35k gas for getPrice", async function () {
            const tx = await priceOracle.getPrice.estimateGas(TOKEN_ADDRESS);
            expect(tx).to.be.lessThan(35000);
        });

        it("Should consume less than 50k gas for setPriceFeed", async function () {
            const token2 = "0x0000000000000000000000000000000000000002";
            const tx = await priceOracle.setPriceFeed.estimateGas(token2, await mockPriceFeed.getAddress());
            expect(tx).to.be.lessThan(50000);
        });
    });

    describe("Multiple Price Feeds", function () {
        let wethFeed: MockV3Aggregator;
        let daiFeed: MockV3Aggregator;
        let usdcFeed: MockV3Aggregator;

        const WETH_TOKEN = "0x0000000000000000000000000000000000000001";
        const DAI_TOKEN = "0x0000000000000000000000000000000000000002";
        const USDC_TOKEN = "0x0000000000000000000000000000000000000003";

        beforeEach(async function () {
            const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
            wethFeed = await MockV3AggregatorFactory.deploy(8, 2000_00000000); // $2000
            daiFeed = await MockV3AggregatorFactory.deploy(8, 1_00000000); // $1
            usdcFeed = await MockV3AggregatorFactory.deploy(8, 1_00000000); // $1

            await priceOracle.setPriceFeed(WETH_TOKEN, await wethFeed.getAddress());
            await priceOracle.setPriceFeed(DAI_TOKEN, await daiFeed.getAddress());
            await priceOracle.setPriceFeed(USDC_TOKEN, await usdcFeed.getAddress());
        });

        it("Should fetch prices for all configured tokens", async function () {
            const wethPrice = await priceOracle.getPrice(WETH_TOKEN);
            const daiPrice = await priceOracle.getPrice(DAI_TOKEN);
            const usdcPrice = await priceOracle.getPrice(USDC_TOKEN);

            expect(wethPrice).to.equal(ethers.parseEther("2000"));
            expect(daiPrice).to.equal(ethers.parseEther("1"));
            expect(usdcPrice).to.equal(ethers.parseEther("1"));
        });

        it("Should handle price updates independently", async function () {
            await wethFeed.updateAnswer(2500_00000000);
            
            const wethPrice = await priceOracle.getPrice(WETH_TOKEN);
            const daiPrice = await priceOracle.getPrice(DAI_TOKEN);

            expect(wethPrice).to.equal(ethers.parseEther("2500"));
            expect(daiPrice).to.equal(ethers.parseEther("1"));
        });
    });

    describe("Edge Cases", function () {
        it("Should handle very high prices", async function () {
            const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
            const highPriceFeed = await MockV3AggregatorFactory.deploy(8, 1000000_00000000); // $1,000,000
            
            await priceOracle.setPriceFeed(TOKEN_ADDRESS, await highPriceFeed.getAddress());
            
            const price = await priceOracle.getPrice(TOKEN_ADDRESS);
            expect(price).to.equal(ethers.parseEther("1000000"));
        });

        it("Should handle very low prices", async function () {
            const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
            const lowPriceFeed = await MockV3AggregatorFactory.deploy(8, 1); // $0.00000001
            
            await priceOracle.setPriceFeed(TOKEN_ADDRESS, await lowPriceFeed.getAddress());
            
            const price = await priceOracle.getPrice(TOKEN_ADDRESS);
            expect(price).to.equal(BigInt(1) * BigInt(10 ** 10));
        });

        it("Should handle maximum uint256 price correctly", async function () {
            const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
            // Use a large but safe value
            const largePriceFeed = await MockV3AggregatorFactory.deploy(8, 2**53 - 1);
            
            await priceOracle.setPriceFeed(TOKEN_ADDRESS, await largePriceFeed.getAddress());
            
            const price = await priceOracle.getPrice(TOKEN_ADDRESS);
            expect(price).to.equal(BigInt(2**53 - 1) * BigInt(10 ** 10));
        });
    });
});
