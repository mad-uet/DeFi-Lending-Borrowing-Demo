import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * All-in-One Deployment Script
 * Deploys all contracts: Mock tokens, Price feeds, Core contracts, and LendingPool
 * This is the consolidated script that combines deploy-mocks.ts and deploy-lending-pool.ts
 */

interface DeploymentAddresses {
    LendingPool: string;
    LARToken: string;
    InterestRateModel: string;
    PriceOracle: string;
    WETH: string;
    DAI: string;
    USDC: string;
    LINK: string;
    WETHPriceFeed: string;
    DAIPriceFeed: string;
    USDCPriceFeed: string;
    LINKPriceFeed: string;
}

async function main() {
    console.log("\n" + "═".repeat(60));
    console.log("  DeFi Lending & Borrowing - Full Deployment");
    console.log("═".repeat(60) + "\n");

    const startTime = Date.now();
    const [deployer, testAccount1, testAccount2] = await ethers.getSigners();
    
    console.log("📍 Deployer:", deployer.address);
    console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // ========================================
    // STEP 1: Deploy Mock ERC20 Tokens
    // ========================================
    console.log("📦 Step 1/7: Deploying Mock ERC20 Tokens...");
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    
    const weth = await MockERC20Factory.deploy("Wrapped Ether", "WETH", 18);
    await weth.waitForDeployment();
    
    const dai = await MockERC20Factory.deploy("Dai Stablecoin", "DAI", 18);
    await dai.waitForDeployment();
    
    const usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();
    
    const link = await MockERC20Factory.deploy("Chainlink", "LINK", 18);
    await link.waitForDeployment();
    
    console.log("   ✓ WETH, DAI, USDC, LINK deployed\n");

    // ========================================
    // STEP 2: Deploy Mock Chainlink Price Feeds
    // ========================================
    console.log("📦 Step 2/7: Deploying Price Feeds...");
    const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");

    const wethPriceFeed = await MockV3AggregatorFactory.deploy(8, 2000_00000000); // $2000
    await wethPriceFeed.waitForDeployment();
    
    const daiPriceFeed = await MockV3AggregatorFactory.deploy(8, 1_00000000); // $1
    await daiPriceFeed.waitForDeployment();
    
    const usdcPriceFeed = await MockV3AggregatorFactory.deploy(8, 1_00000000); // $1
    await usdcPriceFeed.waitForDeployment();
    
    const linkPriceFeed = await MockV3AggregatorFactory.deploy(8, 15_00000000); // $15
    await linkPriceFeed.waitForDeployment();
    
    console.log("   ✓ All price feeds deployed\n");

    // ========================================
    // STEP 3: Deploy PriceOracle
    // ========================================
    console.log("📦 Step 3/7: Deploying PriceOracle...");
    const PriceOracleFactory = await ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracleFactory.deploy();
    await priceOracle.waitForDeployment();

    // Set price feeds
    await (await priceOracle.setPriceFeed(await weth.getAddress(), await wethPriceFeed.getAddress())).wait();
    await (await priceOracle.setPriceFeed(await dai.getAddress(), await daiPriceFeed.getAddress())).wait();
    await (await priceOracle.setPriceFeed(await usdc.getAddress(), await usdcPriceFeed.getAddress())).wait();
    await (await priceOracle.setPriceFeed(await link.getAddress(), await linkPriceFeed.getAddress())).wait();
    
    console.log("   ✓ PriceOracle deployed and configured\n");

    // ========================================
    // STEP 4: Deploy LARToken
    // ========================================
    console.log("📦 Step 4/7: Deploying LARToken...");
    const LARTokenFactory = await ethers.getContractFactory("LARToken");
    const larToken = await LARTokenFactory.deploy();
    await larToken.waitForDeployment();
    console.log("   ✓ LARToken deployed\n");

    // ========================================
    // STEP 5: Deploy InterestRateModel
    // ========================================
    console.log("📦 Step 5/7: Deploying InterestRateModel...");
    const InterestRateModelFactory = await ethers.getContractFactory("InterestRateModel");
    const interestRateModel = await InterestRateModelFactory.deploy();
    await interestRateModel.waitForDeployment();
    console.log("   ✓ InterestRateModel deployed\n");

    // ========================================
    // STEP 6: Deploy LendingPool
    // ========================================
    console.log("📦 Step 6/7: Deploying LendingPool...");
    const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPoolFactory.deploy(
        await larToken.getAddress(),
        await interestRateModel.getAddress(),
        await priceOracle.getAddress()
    );
    await lendingPool.waitForDeployment();

    // Transfer LARToken ownership to LendingPool
    await (await larToken.transferOwnership(await lendingPool.getAddress())).wait();

    // Add supported tokens with LTV ratios
    await (await lendingPool.addToken(await weth.getAddress(), 7500)).wait(); // 75% LTV
    await (await lendingPool.addToken(await dai.getAddress(), 8000)).wait();  // 80% LTV
    await (await lendingPool.addToken(await usdc.getAddress(), 8000)).wait(); // 80% LTV
    await (await lendingPool.addToken(await link.getAddress(), 6000)).wait(); // 60% LTV
    
    console.log("   ✓ LendingPool deployed and configured\n");

    // ========================================
    // STEP 7: Mint Test Tokens
    // ========================================
    console.log("📦 Step 7/7: Minting test tokens...");
    
    // Mint to deployer
    await (await weth.mint(deployer.address, ethers.parseEther("100"))).wait();
    await (await dai.mint(deployer.address, ethers.parseEther("100000"))).wait();
    await (await usdc.mint(deployer.address, 100000_000000n)).wait();
    await (await link.mint(deployer.address, ethers.parseEther("10000"))).wait();

    // Mint to test accounts if available
    if (testAccount1 && testAccount2) {
        const testAmount = ethers.parseEther("1000");
        await (await weth.mint(testAccount1.address, testAmount)).wait();
        await (await weth.mint(testAccount2.address, testAmount)).wait();
        await (await dai.mint(testAccount1.address, ethers.parseEther("50000"))).wait();
        await (await dai.mint(testAccount2.address, ethers.parseEther("50000"))).wait();
    }
    
    console.log("   ✓ Test tokens minted\n");

    // ========================================
    // Save Deployment Addresses
    // ========================================
    const addresses: DeploymentAddresses = {
        LendingPool: await lendingPool.getAddress(),
        LARToken: await larToken.getAddress(),
        InterestRateModel: await interestRateModel.getAddress(),
        PriceOracle: await priceOracle.getAddress(),
        WETH: await weth.getAddress(),
        DAI: await dai.getAddress(),
        USDC: await usdc.getAddress(),
        LINK: await link.getAddress(),
        WETHPriceFeed: await wethPriceFeed.getAddress(),
        DAIPriceFeed: await daiPriceFeed.getAddress(),
        USDCPriceFeed: await usdcPriceFeed.getAddress(),
        LINKPriceFeed: await linkPriceFeed.getAddress(),
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentPath = path.join(deploymentsDir, "localhost.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(addresses, null, 2));

    // ========================================
    // Summary
    // ========================================
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("═".repeat(60));
    console.log("  ✅ DEPLOYMENT COMPLETE!");
    console.log("═".repeat(60));
    console.log("\n📋 Contract Addresses:");
    console.log("─".repeat(50));
    console.log(`   LendingPool:       ${addresses.LendingPool}`);
    console.log(`   LARToken:          ${addresses.LARToken}`);
    console.log(`   InterestRateModel: ${addresses.InterestRateModel}`);
    console.log(`   PriceOracle:       ${addresses.PriceOracle}`);
    console.log("\n🪙 Token Addresses:");
    console.log("─".repeat(50));
    console.log(`   WETH:  ${addresses.WETH} (LTV: 75%)`);
    console.log(`   DAI:   ${addresses.DAI} (LTV: 80%)`);
    console.log(`   USDC:  ${addresses.USDC} (LTV: 80%)`);
    console.log(`   LINK:  ${addresses.LINK} (LTV: 60%)`);
    console.log("\n💰 Price Feeds:");
    console.log("─".repeat(50));
    console.log(`   WETH/USD: $2000  |  DAI/USD: $1`);
    console.log(`   USDC/USD: $1     |  LINK/USD: $15`);
    console.log("\n─".repeat(50));
    console.log(`📁 Addresses saved to: ${deploymentPath}`);
    console.log(`⏱️  Deployment time: ${elapsed}s`);
    console.log("═".repeat(60) + "\n");

    return addresses;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
