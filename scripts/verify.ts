import { run } from "hardhat";

async function main() {
  const address = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("Set CONTRACT_ADDRESS or NEXT_PUBLIC_CONTRACT_ADDRESS before running verify.");
  }

  console.log(`[verify] verifying ObsidianVault at ${address}`);
  await run("verify:verify", {
    address,
    constructorArguments: []
  });
  console.log("[verify] complete");
}

main().catch((error) => {
  console.error("[verify] failed", error);
  process.exitCode = 1;
});
