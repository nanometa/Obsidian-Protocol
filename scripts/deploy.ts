import * as fs from "node:fs";
import * as path from "node:path";
import { ethers, network } from "hardhat";

async function main() {
  console.log(`[deploy] network=${network.name}`);
  if (!process.env.PRIVATE_KEY?.trim()) {
    throw new Error("PRIVATE_KEY is missing in the root .env file.");
  }

  const [deployer] = await ethers.getSigners();
  console.log(`[deploy] deployer=${deployer.address}`);

  const ObsidianVault = await ethers.getContractFactory("ObsidianVault");
  const vault = await ObsidianVault.deploy();
  await vault.waitForDeployment();
  const deploymentReceipt = await vault.deploymentTransaction()?.wait();

  const address = await vault.getAddress();
  const deploymentBlock = deploymentReceipt?.blockNumber;
  console.log(`ObsidianVault deployed to: ${address}`);
  console.log(`[deploy] ObsidianVault=${address}`);
  if (deploymentBlock) console.log(`[deploy] block=${deploymentBlock}`);
  console.log(`[deploy] explorer=${process.env.NEXT_PUBLIC_EXPLORER_URL || "https://testnet.arcscan.app"}/address/${address}`);

  const deployment = {
    contractName: "ObsidianVault",
    address,
    network: network.name,
    chainId: network.config.chainId,
    blockNumber: deploymentBlock,
    deployedAt: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, "..", "frontend", "lib", "deployment.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(`[deploy] wrote ${outputPath}`);
}

main().catch((error) => {
  console.error("[deploy] failed", error);
  process.exitCode = 1;
});
