import { ethers } from "hardhat";
import * as fs from "fs";

/**
 * Update all mock price feeds to current timestamp
 * This prevents "Stale price" errors in development
 */
async function main() {
  console.log("Updating price feeds to prevent stale price errors...\n");

  // Load deployment data
  const deploymentPath = "./deployments/localhost.json";
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment file found at:", deploymentPath);
    console.error("Please deploy contracts first using: npm run deploy");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  // Get price feeds from deployment
  const priceFeeds = [
    { name: "WETH", address: deployment.WETHPriceFeed },
    { name: "DAI", address: deployment.DAIPriceFeed },
    { name: "USDC", address: deployment.USDCPriceFeed },
    { name: "LINK", address: deployment.LINKPriceFeed },
  ];

  // Update each price feed
  for (const feed of priceFeeds) {
    if (!feed.address) {
      console.log(`⚠️  ${feed.name} price feed not found in deployment`);
      continue;
    }

    try {
      const priceFeed = await ethers.getContractAt("MockV3Aggregator", feed.address);
      
      // Get current price
      const currentAnswer = await priceFeed.latestAnswer();
      
      // Update with same price (this updates the timestamp)
      const tx = await priceFeed.updateAnswer(currentAnswer);
      await tx.wait();
      
      console.log(`✅ Updated ${feed.name} price feed (${feed.address})`);
    } catch (error) {
      console.error(`❌ Failed to update ${feed.name} price feed:`, error);
    }
  }

  console.log("\n✨ Price feeds updated successfully!");
  console.log("You can now perform supply/borrow operations without stale price errors.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
