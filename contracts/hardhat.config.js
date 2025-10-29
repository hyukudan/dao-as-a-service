require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    // Attelyx devnet local
    devnet: {
      url: process.env.ATTELYX_RPC_URL || "http://localhost:8545",
      chainId: 41337,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    // Attelyx testnet
    testnet: {
      url: process.env.ATTELYX_TESTNET_RPC_URL || "https://testnet-rpc.attelyx.com",
      chainId: 41338,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    // Attelyx mainnet
    mainnet: {
      url: process.env.ATTELYX_MAINNET_RPC_URL || "https://rpc.attelyx.com",
      chainId: 4133,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
