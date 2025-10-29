const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Starting contract verification...\n");

  // Load latest deployment
  const network = hre.network.name;
  const deploymentPath = path.join(__dirname, "../deployments", `${network}-latest.json`);

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment found for network:", network);
    console.error("   Please deploy contracts first using: npx hardhat run scripts/deploy.js --network", network);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📄 Loaded deployment from:", deploymentPath);
  console.log("   Network:", deployment.network);
  console.log("   Deployed at:", deployment.timestamp);
  console.log();

  const contracts = [
    {
      name: "DAOCore",
      address: deployment.contracts.implementations.DAOCore,
      constructorArgs: [],
    },
    {
      name: "GovernanceModule",
      address: deployment.contracts.implementations.GovernanceModule,
      constructorArgs: [],
    },
    {
      name: "TreasuryModule",
      address: deployment.contracts.implementations.TreasuryModule,
      constructorArgs: [],
    },
    {
      name: "FDNFTMembership",
      address: deployment.contracts.implementations.FDNFTMembership,
      constructorArgs: [],
    },
    {
      name: "DAOFactory",
      address: deployment.contracts.DAOFactory,
      constructorArgs: [
        deployment.contracts.implementations.DAOCore,
        deployment.contracts.implementations.GovernanceModule,
        deployment.contracts.implementations.TreasuryModule,
        deployment.contracts.implementations.FDNFTMembership,
      ],
    },
  ];

  console.log("🔍 Verifying contracts...\n");

  for (const contract of contracts) {
    console.log(`Verifying ${contract.name} at ${contract.address}...`);
    try {
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArgs,
      });
      console.log(`✅ ${contract.name} verified successfully\n`);
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`ℹ️  ${contract.name} already verified\n`);
      } else {
        console.error(`❌ Failed to verify ${contract.name}:`);
        console.error(error.message);
        console.log();
      }
    }
  }

  console.log("✅ Verification process complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });
