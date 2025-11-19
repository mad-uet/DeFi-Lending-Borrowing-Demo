import fs from 'fs';
import path from 'path';

/**
 * Script to copy contract ABIs and addresses from Hardhat artifacts to frontend
 * Run this after deployment: npx ts-node scripts/copy-artifacts-to-frontend.ts
 */

const ARTIFACTS_DIR = path.join(__dirname, '../artifacts/contracts');
const FRONTEND_LIB_DIR = path.join(__dirname, '../frontend/src/lib');
const FRONTEND_ENV = path.join(__dirname, '../frontend/.env.local');

interface DeploymentAddresses {
  LendingPool: string;
  LARToken: string;
  InterestRateModel: string;
  PriceOracle: string;
  WETH: string;
  DAI: string;
  USDC: string;
  LINK: string;
}

async function main() {
  console.log('📦 Copying contract artifacts to frontend...\n');

  // Create frontend lib directory if it doesn't exist
  if (!fs.existsSync(FRONTEND_LIB_DIR)) {
    fs.mkdirSync(FRONTEND_LIB_DIR, { recursive: true });
  }

  // Read deployment addresses (you'll need to create this file after deployment)
  const deploymentPath = path.join(__dirname, '../deployments/localhost.json');
  
  if (!fs.existsSync(deploymentPath)) {
    console.log('⚠️  Deployment addresses not found. Please deploy contracts first.');
    console.log('   After deployment, create deployments/localhost.json with contract addresses.\n');
    
    // Create example deployment file
    const exampleDeployment: DeploymentAddresses = {
      LendingPool: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      LARToken: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      InterestRateModel: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      PriceOracle: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      WETH: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      DAI: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
      USDC: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
      LINK: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(
      deploymentPath,
      JSON.stringify(exampleDeployment, null, 2)
    );

    console.log('✅ Created example deployment file at deployments/localhost.json');
    console.log('   Update it with your actual contract addresses after deployment.\n');
  }

  const addresses: DeploymentAddresses = JSON.parse(
    fs.readFileSync(deploymentPath, 'utf-8')
  );

  // Create .env.local file for frontend
  const envContent = `# Contract Addresses (Auto-generated)
NEXT_PUBLIC_LENDING_POOL_ADDRESS=${addresses.LendingPool}
NEXT_PUBLIC_LAR_TOKEN_ADDRESS=${addresses.LARToken}
NEXT_PUBLIC_INTEREST_RATE_MODEL_ADDRESS=${addresses.InterestRateModel}
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=${addresses.PriceOracle}
NEXT_PUBLIC_WETH_ADDRESS=${addresses.WETH}
NEXT_PUBLIC_DAI_ADDRESS=${addresses.DAI}
NEXT_PUBLIC_USDC_ADDRESS=${addresses.USDC}
NEXT_PUBLIC_LINK_ADDRESS=${addresses.LINK}
NEXT_PUBLIC_CHAIN_ID=31337
`;

  fs.writeFileSync(FRONTEND_ENV, envContent);
  console.log('✅ Created .env.local file with contract addresses\n');

  console.log('📋 Contract Addresses:');
  console.log('━'.repeat(60));
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`${name.padEnd(20)}: ${address}`);
  });
  console.log('━'.repeat(60));
  console.log('\n✨ Frontend setup complete!');
  console.log('\nNext steps:');
  console.log('1. cd frontend');
  console.log('2. npm install');
  console.log('3. npm run dev');
  console.log('\n🚀 Your DeFi app will be available at http://localhost:3000\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
