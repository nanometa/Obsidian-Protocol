import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const privateKey = process.env.PRIVATE_KEY?.trim();
const arcPrivateKey = privateKey ? (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) : undefined;
const arcScanApiUrl = process.env.ARCSCAN_API_URL || "https://testnet.arcscan.app/api";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    arc: {
      url: "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: arcPrivateKey ? [arcPrivateKey] : []
    }
  },
  etherscan: {
    apiKey: {
      arc: process.env.ARCSCAN_API_KEY || "not-required"
    },
    customChains: [
      {
        network: "arc",
        chainId: 5042002,
        urls: {
          apiURL: arcScanApiUrl,
          browserURL: process.env.NEXT_PUBLIC_EXPLORER_URL || "https://testnet.arcscan.app"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};

export default config;
