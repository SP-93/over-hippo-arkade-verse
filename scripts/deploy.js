const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ArcadeGameContract to Over Protocol Mainnet...");

  // Get the contract factory
  const ArcadeGameContract = await ethers.getContractFactory("ArcadeGameContract");

  // For mainnet deployment, you'll need the actual OVER token address
  // This is a placeholder - replace with the real OVER token contract address
  const OVER_TOKEN_ADDRESS = "0x..."; // Get from Over Protocol documentation

  // Deploy the contract
  const arcadeContract = await ArcadeGameContract.deploy(OVER_TOKEN_ADDRESS);
  await arcadeContract.waitForDeployment();

  const contractAddress = await arcadeContract.getAddress();
  console.log("ArcadeGameContract deployed to:", contractAddress);

  // Save deployment info
  console.log("\n=== DEPLOYMENT INFO ===");
  console.log("Network: Over Protocol Mainnet");
  console.log("Chain ID: 54176");
  console.log("Contract Address:", contractAddress);
  console.log("OVER Token Address:", OVER_TOKEN_ADDRESS);
  console.log("Block Explorer:", `https://scan.over.network/address/${contractAddress}`);
  
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Update ARCADE_CONTRACT in src/types/over-protocol.ts");
  console.log("2. Update OVER_TOKEN in src/types/over-protocol.ts");
  console.log("3. Verify contract on Over Protocol explorer");
  console.log("4. Test contract functionality");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });