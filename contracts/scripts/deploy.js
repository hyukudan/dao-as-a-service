const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting DAO-as-a-Service deployment to Attelyx Chain...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy Implementation Contracts
  console.log("📦 Deploying implementation contracts...");

  // 1. Deploy DAOCore implementation
  console.log("   - Deploying DAOCore...");
  const DAOCore = await hre.ethers.getContractFactory("DAOCore");
  const daoCoreImpl = await DAOCore.deploy();
  await daoCoreImpl.waitForDeployment();
  const daoCoreImplAddress = await daoCoreImpl.getAddress();
  console.log("   ✅ DAOCore implementation deployed to:", daoCoreImplAddress);

  // 2. Deploy GovernanceModule implementation
  console.log("   - Deploying GovernanceModule...");
  const GovernanceModule = await hre.ethers.getContractFactory("GovernanceModule");
  const governanceImpl = await GovernanceModule.deploy();
  await governanceImpl.waitForDeployment();
  const governanceImplAddress = await governanceImpl.getAddress();
  console.log("   ✅ GovernanceModule implementation deployed to:", governanceImplAddress);

  // 3. Deploy TreasuryModule implementation
  console.log("   - Deploying TreasuryModule...");
  const TreasuryModule = await hre.ethers.getContractFactory("TreasuryModule");
  const treasuryImpl = await TreasuryModule.deploy();
  await treasuryImpl.waitForDeployment();
  const treasuryImplAddress = await treasuryImpl.getAddress();
  console.log("   ✅ TreasuryModule implementation deployed to:", treasuryImplAddress);

  // 4. Deploy FDNFTMembership implementation
  console.log("   - Deploying FDNFTMembership...");
  const FDNFTMembership = await hre.ethers.getContractFactory("FDNFTMembership");
  const nftImpl = await FDNFTMembership.deploy();
  await nftImpl.waitForDeployment();
  const nftImplAddress = await nftImpl.getAddress();
  console.log("   ✅ FDNFTMembership implementation deployed to:", nftImplAddress);

  // 5. Deploy DAOFactory
  console.log("\n📦 Deploying DAOFactory...");
  const DAOFactory = await hre.ethers.getContractFactory("DAOFactory");
  const factory = await DAOFactory.deploy(
    daoCoreImplAddress,
    governanceImplAddress,
    treasuryImplAddress,
    nftImplAddress
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   ✅ DAOFactory deployed to:", factoryAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      DAOFactory: factoryAddress,
      implementations: {
        DAOCore: daoCoreImplAddress,
        GovernanceModule: governanceImplAddress,
        TreasuryModule: treasuryImplAddress,
        FDNFTMembership: nftImplAddress,
      },
    },
  };

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  // Also save as latest
  const latestFilepath = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
  fs.writeFileSync(latestFilepath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment info saved to:", filepath);
  console.log("📄 Latest deployment:", latestFilepath);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   DAOFactory:", factoryAddress);
  console.log("   DAOCore Implementation:", daoCoreImplAddress);
  console.log("   GovernanceModule Implementation:", governanceImplAddress);
  console.log("   TreasuryModule Implementation:", treasuryImplAddress);
  console.log("   FDNFTMembership Implementation:", nftImplAddress);
  console.log("\n📝 Next Steps:");
  console.log("   1. Update frontend .env with NEXT_PUBLIC_FACTORY_ADDRESS=" + factoryAddress);
  console.log("   2. Update backend .env with FACTORY_ADDRESS=" + factoryAddress);
  console.log("   3. Verify contracts on block explorer (if available)");
  console.log("   4. Start the indexer to listen for DAO creation events");
  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
