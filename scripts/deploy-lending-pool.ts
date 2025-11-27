import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Starting LendingPool deployment...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Step 1: Deploy Mock ERC20 Tokens
    console.log("1. Deploying Mock ERC20 Tokens...");
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    
    const weth = await MockERC20Factory.deploy("Wrapped Ether", "WETH", 18);
    await weth.waitForDeployment();
    console.log("   WETH deployed to:", await weth.getAddress());

    const dai = await MockERC20Factory.deploy("Dai Stablecoin", "DAI", 18);
    await dai.waitForDeployment();
    console.log("   DAI deployed to:", await dai.getAddress());

    const usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();
    console.log("   USDC deployed to:", await usdc.getAddress());

    const link = await MockERC20Factory.deploy("Chainlink", "LINK", 18);
    await link.waitForDeployment();
    console.log("   LINK deployed to:", await link.getAddress());

    // Step 2: Deploy Mock Chainlink Price Feeds
    console.log("\n2. Deploying Mock Chainlink Price Feeds...");
    const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");

    const wethPriceFeed = await MockV3AggregatorFactory.deploy(8, 2000_00000000); // $2000
    await wethPriceFeed.waitForDeployment();
    console.log("   WETH/USD Price Feed deployed to:", await wethPriceFeed.getAddress());

    const daiPriceFeed = await MockV3AggregatorFactory.deploy(8, 1_00000000); // $1
    await daiPriceFeed.waitForDeployment();
    console.log("   DAI/USD Price Feed deployed to:", await daiPriceFeed.getAddress());

    const usdcPriceFeed = await MockV3AggregatorFactory.deploy(8, 1_00000000); // $1
    await usdcPriceFeed.waitForDeployment();
    console.log("   USDC/USD Price Feed deployed to:", await usdcPriceFeed.getAddress());

    const linkPriceFeed = await MockV3AggregatorFactory.deploy(8, 15_00000000); // $15
    await linkPriceFeed.waitForDeployment();
    console.log("   LINK/USD Price Feed deployed to:", await linkPriceFeed.getAddress());

    // Step 3: Deploy PriceOracle
    console.log("\n3. Deploying PriceOracle...");
    const PriceOracleFactory = await ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracleFactory.deploy();
    await priceOracle.waitForDeployment();
    console.log("   PriceOracle deployed to:", await priceOracle.getAddress());

    // Set all price feeds in PriceOracle
    console.log("\n   Setting price feeds in PriceOracle...");
    await (await priceOracle.setPriceFeed(await weth.getAddress(), await wethPriceFeed.getAddress())).wait();
    console.log("   ✓ WETH price feed set");
    
    await (await priceOracle.setPriceFeed(await dai.getAddress(), await daiPriceFeed.getAddress())).wait();
    console.log("   ✓ DAI price feed set");
    
    await (await priceOracle.setPriceFeed(await usdc.getAddress(), await usdcPriceFeed.getAddress())).wait();
    console.log("   ✓ USDC price feed set");
    
    await (await priceOracle.setPriceFeed(await link.getAddress(), await linkPriceFeed.getAddress())).wait();
    console.log("   ✓ LINK price feed set");

    // Step 4: Deploy LARToken
    console.log("\n4. Deploying LARToken...");
    const LARTokenFactory = await ethers.getContractFactory("LARToken");
    const larToken = await LARTokenFactory.deploy();
    await larToken.waitForDeployment();
    console.log("   LARToken deployed to:", await larToken.getAddress());
    console.log("   Initial supply:", ethers.formatEther(await larToken.totalSupply()), "LAR");

    // Step 5: Deploy InterestRateModel
    console.log("\n5. Deploying InterestRateModel...");
    const InterestRateModelFactory = await ethers.getContractFactory("InterestRateModel");
    const interestRateModel = await InterestRateModelFactory.deploy();
    await interestRateModel.waitForDeployment();
    console.log("   InterestRateModel deployed to:", await interestRateModel.getAddress());
    console.log("   Optimal Utilization:", await interestRateModel.OPTIMAL_UTILIZATION(), "%");
    console.log("   Base Rate:", await interestRateModel.BASE_RATE(), "%");
    console.log("   Slope 1:", await interestRateModel.SLOPE_1(), "%");
    console.log("   Slope 2:", await interestRateModel.SLOPE_2(), "%");

    // Step 6: Deploy LendingPool
    console.log("\n6. Deploying LendingPool...");
    const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPoolFactory.deploy(
        await larToken.getAddress(),
        await interestRateModel.getAddress(),
        await priceOracle.getAddress()
    );
    await lendingPool.waitForDeployment();
    console.log("   LendingPool deployed to:", await lendingPool.getAddress());

    // Step 7: Transfer LARToken ownership to LendingPool
    console.log("\n7. Transferring LARToken ownership to LendingPool...");
    const tx = await larToken.transferOwnership(await lendingPool.getAddress());
    await tx.wait();
    console.log("   Ownership transferred successfully");

    // Step 8: Add supported tokens to LendingPool
    console.log("\n8. Adding supported tokens to LendingPool...");
    
    const WETH_LTV = 7500; // 75%
    const DAI_LTV = 8000;  // 80%
    const USDC_LTV = 8000; // 80%
    const LINK_LTV = 6000; // 60%

    await (await lendingPool.addToken(await weth.getAddress(), WETH_LTV)).wait();
    console.log("   ✓ WETH added (LTV: 75%)");

    await (await lendingPool.addToken(await dai.getAddress(), DAI_LTV)).wait();
    console.log("   ✓ DAI added (LTV: 80%)");

    await (await lendingPool.addToken(await usdc.getAddress(), USDC_LTV)).wait();
    console.log("   ✓ USDC added (LTV: 80%)");

    await (await lendingPool.addToken(await link.getAddress(), LINK_LTV)).wait();
    console.log("   ✓ LINK added (LTV: 60%)");

    // Step 9: Mint test tokens to deployer
    console.log("\n9. Minting test tokens to deployer...");
    await (await weth.mint(deployer.address, ethers.parseEther("100"))).wait();
    console.log("   ✓ Minted 100 WETH");

    await (await dai.mint(deployer.address, ethers.parseEther("100000"))).wait();
    console.log("   ✓ Minted 100,000 DAI");

    await (await usdc.mint(deployer.address, 100000_000000)).wait();
    console.log("   ✓ Minted 100,000 USDC");

    await (await link.mint(deployer.address, ethers.parseEther("10000"))).wait();
    console.log("   ✓ Minted 10,000 LINK");

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("\nContract Addresses:");
    console.log("-------------------");
    console.log("LendingPool:       ", await lendingPool.getAddress());
    console.log("LARToken:          ", await larToken.getAddress());
    console.log("InterestRateModel: ", await interestRateModel.getAddress());
    console.log("PriceOracle:       ", await priceOracle.getAddress());
    console.log("\nToken Addresses:");
    console.log("----------------");
    console.log("WETH:  ", await weth.getAddress(), "(LTV: 75%)");
    console.log("DAI:   ", await dai.getAddress(), "(LTV: 80%)");
    console.log("USDC:  ", await usdc.getAddress(), "(LTV: 80%)");
    console.log("LINK:  ", await link.getAddress(), "(LTV: 60%)");
    console.log("\nPrice Feed Addresses:");
    console.log("---------------------");
    console.log("WETH/USD: ", await wethPriceFeed.getAddress(), "($2000)");
    console.log("DAI/USD:  ", await daiPriceFeed.getAddress(), "($1)");
    console.log("USDC/USD: ", await usdcPriceFeed.getAddress(), "($1)");
    console.log("LINK/USD: ", await linkPriceFeed.getAddress(), "($15)");
    console.log("\n" + "=".repeat(60));

    // Save addresses to deployments/localhost.json
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const addresses = {
        LendingPool: await lendingPool.getAddress(),
        LARToken: await larToken.getAddress(),
        InterestRateModel: await interestRateModel.getAddress(),
        PriceOracle: await priceOracle.getAddress(),
        WETH: await weth.getAddress(),
        DAI: await dai.getAddress(),
        USDC: await usdc.getAddress(),
        LINK: await link.getAddress(),
    };

    const deploymentPath = path.join(deploymentsDir, "localhost.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(addresses, null, 2));
    console.log(`\n✅ Contract addresses saved to ${deploymentPath}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
