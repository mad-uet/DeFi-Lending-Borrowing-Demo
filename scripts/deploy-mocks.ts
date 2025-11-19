import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Mock Tokens and Price Feeds...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy Mock ERC20 Tokens
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  
  console.log("Deploying WETH (Wrapped Ether)...");
  const weth = await MockERC20Factory.deploy("Wrapped Ether", "WETH", 18);
  await weth.waitForDeployment();
  console.log("WETH deployed to:", await weth.getAddress());

  console.log("Deploying DAI...");
  const dai = await MockERC20Factory.deploy("Dai Stablecoin", "DAI", 18);
  await dai.waitForDeployment();
  console.log("DAI deployed to:", await dai.getAddress());

  console.log("Deploying USDC...");
  const usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  console.log("USDC deployed to:", await usdc.getAddress());

  console.log("Deploying LINK...");
  const link = await MockERC20Factory.deploy("Chainlink Token", "LINK", 18);
  await link.waitForDeployment();
  console.log("LINK deployed to:", await link.getAddress());

  // Deploy Mock Chainlink Price Feeds
  const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");

  console.log("\nDeploying Price Feeds...");
  
  console.log("Deploying WETH/USD Price Feed...");
  const wethPriceFeed = await MockV3AggregatorFactory.deploy(8, 2000_00000000); // $2000
  await wethPriceFeed.waitForDeployment();
  console.log("WETH/USD Price Feed deployed to:", await wethPriceFeed.getAddress());

  console.log("Deploying DAI/USD Price Feed...");
  const daiPriceFeed = await MockV3AggregatorFactory.deploy(8, 1_00000000); // $1
  await daiPriceFeed.waitForDeployment();
  console.log("DAI/USD Price Feed deployed to:", await daiPriceFeed.getAddress());

  console.log("Deploying USDC/USD Price Feed...");
  const usdcPriceFeed = await MockV3AggregatorFactory.deploy(8, 1_00000000); // $1
  await usdcPriceFeed.waitForDeployment();
  console.log("USDC/USD Price Feed deployed to:", await usdcPriceFeed.getAddress());

  console.log("Deploying LINK/USD Price Feed...");
  const linkPriceFeed = await MockV3AggregatorFactory.deploy(8, 15_00000000); // $15
  await linkPriceFeed.waitForDeployment();
  console.log("LINK/USD Price Feed deployed to:", await linkPriceFeed.getAddress());

  // Mint initial tokens for testing
  console.log("\nMinting initial tokens for deployer...");
  
  const wethAmount = ethers.parseEther("100");
  await weth.mint(deployer.address, wethAmount);
  console.log("Minted 100 WETH to deployer");

  const daiAmount = ethers.parseEther("10000");
  await dai.mint(deployer.address, daiAmount);
  console.log("Minted 10,000 DAI to deployer");

  const usdcAmount = 10000_000000n; // 10,000 USDC with 6 decimals
  await usdc.mint(deployer.address, usdcAmount);
  console.log("Minted 10,000 USDC to deployer");

  const linkAmount = ethers.parseEther("1000");
  await link.mint(deployer.address, linkAmount);
  console.log("Minted 1,000 LINK to deployer");

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log("\nTokens:");
  console.log("  WETH:", await weth.getAddress());
  console.log("  DAI:", await dai.getAddress());
  console.log("  USDC:", await usdc.getAddress());
  console.log("  LINK:", await link.getAddress());
  
  console.log("\nPrice Feeds:");
  console.log("  WETH/USD:", await wethPriceFeed.getAddress(), "($2000)");
  console.log("  DAI/USD:", await daiPriceFeed.getAddress(), "($1)");
  console.log("  USDC/USD:", await usdcPriceFeed.getAddress(), "($1)");
  console.log("  LINK/USD:", await linkPriceFeed.getAddress(), "($15)");
  
  console.log("\nDeployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
