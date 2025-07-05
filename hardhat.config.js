require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    overprotocol: {
      url: "https://rpc.overprotocol.com",
      chainId: 54176,
      // Add your private key for deployment:
      // accounts: ["0x...your_private_key"]
    },
  },
  etherscan: {
    apiKey: {
      overprotocol: "your_api_key_here", // For contract verification
    },
    customChains: [
      {
        network: "overprotocol",
        chainId: 54176,
        urls: {
          apiURL: "https://scan.over.network/api",
          browserURL: "https://scan.over.network"
        }
      }
    ]
  }
};