import { ethers, network } from "hardhat";

const STATUS_LABELS = ["NONE", "ACTIVE", "EXPIRED", "TRIGGERED"] as const;
const DEFAULT_BLOCK_CHUNK_SIZE = 9_999n;

const OBSIDIAN_VAULT_ABI = [
  "event VaultCreated(address indexed user, string ipfsHash, uint256 timer)",
  "function getStatus(address user) view returns (uint8)",
  "function getVault(address user) view returns (bool exists, address owner, string ipfsHash, string encryptedKeyPartA, string encryptedKeyPartB, uint256 timerDuration, uint256 createdAt, uint256 lastHeartbeat, uint256 deadline, bool triggered, uint256 triggeredAt, address[] beneficiaries)",
  "function activateTrigger(address user)"
] as const;

async function main() {
  console.log(`[keeper] network=${network.name}`);

  const contractAddress = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    throw new Error("Set CONTRACT_ADDRESS or NEXT_PUBLIC_CONTRACT_ADDRESS to the ObsidianVault address.");
  }

  const [keeper] = await ethers.getSigners();
  if (!keeper) {
    throw new Error("No keeper signer available. Set PRIVATE_KEY in root .env.");
  }

  const execute = process.env.KEEPER_EXECUTE === "true" || process.argv.includes("--execute");
  const confirmations = Number(process.env.KEEPER_CONFIRMATIONS || "1");
  const latestBlock = BigInt(await ethers.provider.getBlockNumber());
  const fromBlock = BigInt(process.env.KEEPER_FROM_BLOCK || process.env.NEXT_PUBLIC_EVENT_START_BLOCK || "0");
  const toBlock = BigInt(process.env.KEEPER_TO_BLOCK || latestBlock.toString());
  const chunkSize = BigInt(process.env.KEEPER_BLOCK_CHUNK_SIZE || DEFAULT_BLOCK_CHUNK_SIZE.toString());

  if (fromBlock > toBlock) {
    throw new Error(`KEEPER_FROM_BLOCK (${fromBlock}) cannot be greater than toBlock (${toBlock}).`);
  }

  const vault = new ethers.Contract(contractAddress, OBSIDIAN_VAULT_ABI, keeper);
  const owners = await findVaultOwners(vault, fromBlock, toBlock, chunkSize);

  console.log(`[keeper] contract=${contractAddress}`);
  console.log(`[keeper] keeper=${keeper.address}`);
  console.log(`[keeper] mode=${execute ? "EXECUTE" : "DRY_RUN"}`);
  console.log(`[keeper] scannedBlocks=${fromBlock}-${toBlock}`);
  console.log(`[keeper] vaultsFound=${owners.length}`);

  let expiredCount = 0;
  let triggeredCount = 0;

  for (const owner of owners) {
    const statusCode = Number(await vault.getStatus(owner));
    const statusLabel = STATUS_LABELS[statusCode] || `UNKNOWN_${statusCode}`;
    const record = await vault.getVault(owner);
    const deadline = Number(record.deadline);
    const deadlineIso = deadline > 0 ? new Date(deadline * 1000).toISOString() : "NONE";

    console.log(`[keeper] owner=${owner} status=${statusLabel} deadline=${deadlineIso}`);

    if (statusCode !== 2) continue;
    expiredCount += 1;

    if (!execute) {
      console.log(`[keeper] dryRun would activateTrigger(${owner})`);
      continue;
    }

    console.log(`[keeper] sending activateTrigger(${owner})`);
    const tx = await vault.activateTrigger(owner);
    console.log(`[keeper] tx=${tx.hash}`);
    await tx.wait(confirmations);
    triggeredCount += 1;
    console.log(`[keeper] triggered owner=${owner}`);
  }

  console.log(`[keeper] expiredFound=${expiredCount}`);
  console.log(`[keeper] triggered=${triggeredCount}`);
  if (!execute && expiredCount > 0) {
    console.log("[keeper] dry-run only. Set KEEPER_EXECUTE=true or pass --execute to send transactions.");
  }
}

async function findVaultOwners(
  vault: ethers.Contract,
  fromBlock: bigint,
  toBlock: bigint,
  chunkSize: bigint
): Promise<string[]> {
  const owners = new Set<string>();

  for (let start = fromBlock; start <= toBlock; start += chunkSize + 1n) {
    const end = start + chunkSize > toBlock ? toBlock : start + chunkSize;
    console.log(`[keeper] query VaultCreated blocks ${start}-${end}`);
    const logs = await vault.queryFilter(vault.filters.VaultCreated(), Number(start), Number(end));

    for (const log of logs) {
      const parsed = "args" in log ? log.args : undefined;
      const owner = parsed?.user;
      if (typeof owner === "string") {
        owners.add(owner);
      }
    }
  }

  return [...owners];
}

main().catch((error) => {
  console.error("[keeper] failed", error);
  process.exitCode = 1;
});
