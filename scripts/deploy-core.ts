import { ethers } from "hardhat";

/**
 * Deploy script for Phase 2: LAR Token and Interest Rate Model
 * Deploys core reward token and dynamic interest rate calculator
 */
async function main() {
  const [deployer, testAccount1, testAccount2] = await ethers.getSigners();

  console.log("========================================");
  console.log("Phase 2: LAR Token & Interest Rate Model Deployment");
  console.log("========================================\n");

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy LAR Token
  console.log("1. Deploying LARToken...");
  const LARTokenFactory = await ethers.getContractFactory("LARToken");
  const larToken = await LARTokenFactory.deploy();
  await larToken.waitForDeployment();
  const larTokenAddress = await larToken.getAddress();
  
  console.log("   ✓ LARToken deployed to:", larTokenAddress);
  console.log("   ✓ Initial supply:", ethers.formatEther(await larToken.totalSupply()), "LAR");
  console.log("   ✓ Deployer balance:", ethers.formatEther(await larToken.balanceOf(deployer.address)), "LAR\n");

  // Deploy Interest Rate Model
  console.log("2. Deploying InterestRateModel...");
  const InterestRateModelFactory = await ethers.getContractFactory("InterestRateModel");
  const interestRateModel = await InterestRateModelFactory.deploy();
  await interestRateModel.waitForDeployment();
  const interestRateModelAddress = await interestRateModel.getAddress();
  
  console.log("   ✓ InterestRateModel deployed to:", interestRateModelAddress);
  console.log("   ✓ Optimal Utilization:", await interestRateModel.OPTIMAL_UTILIZATION(), "%");
  console.log("   ✓ Base Rate:", await interestRateModel.BASE_RATE(), "%");
  console.log("   ✓ Slope 1:", await interestRateModel.SLOPE_1(), "%");
  console.log("   ✓ Slope 2:", await interestRateModel.SLOPE_2(), "%\n");

  // Transfer some LAR to test accounts
  console.log("3. Distributing LAR tokens to test accounts...");
  const testAmount = ethers.parseEther("10000"); // 10k LAR per test account
  
  await larToken.transfer(testAccount1.address, testAmount);
  console.log("   ✓ Transferred", ethers.formatEther(testAmount), "LAR to", testAccount1.address);
  
  await larToken.transfer(testAccount2.address, testAmount);
  console.log("   ✓ Transferred", ethers.formatEther(testAmount), "LAR to", testAccount2.address);
  
  console.log("\n4. Testing Interest Rate Model calculations...");
  
  // Test scenarios
  const testScenarios = [
    { borrowed: ethers.parseEther("0"), supplied: ethers.parseEther("1000"), label: "0% utilization" },
    { borrowed: ethers.parseEther("400"), supplied: ethers.parseEther("1000"), label: "40% utilization" },
    { borrowed: ethers.parseEther("800"), supplied: ethers.parseEther("1000"), label: "80% utilization" },
    { borrowed: ethers.parseEther("900"), supplied: ethers.parseEther("1000"), label: "90% utilization" },
    { borrowed: ethers.parseEther("1000"), supplied: ethers.parseEther("1000"), label: "100% utilization" },
  ];

  for (const scenario of testScenarios) {
    const rate = await interestRateModel.calculateBorrowRate(scenario.borrowed, scenario.supplied);
    const ratePercent = Number(rate) / 100;
    console.log(`   ${scenario.label}: ${ratePercent}% (${rate} bps)`);
  }

  console.log("\n========================================");
  console.log("Deployment Summary");
  console.log("========================================");
  console.log("LARToken:          ", larTokenAddress);
  console.log("InterestRateModel: ", interestRateModelAddress);
  console.log("\nDeployer balance:  ", ethers.formatEther(await larToken.balanceOf(deployer.address)), "LAR");
  console.log("Test Account 1:    ", ethers.formatEther(await larToken.balanceOf(testAccount1.address)), "LAR");
  console.log("Test Account 2:    ", ethers.formatEther(await larToken.balanceOf(testAccount2.address)), "LAR");
  console.log("========================================\n");

  // Return deployment info for potential scripting
  return {
    larToken: larTokenAddress,
    interestRateModel: interestRateModelAddress,
    deployer: deployer.address,
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
