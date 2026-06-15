import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import {
  createPublicClient,
  formatEther,
  getAbiItem,
  http,
  isAddress,
  type Address,
  type Hex
} from "viem";
import { OBSIDIAN_VAULT_ABI } from "@/lib/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STATUS_EXPIRED = 2;
const DEFAULT_BLOCK_CHUNK_SIZE = 9000n;
const DEFAULT_MAX_CHUNKS = 120;
const DEFAULT_MAX_TX = 3;
const FALLBACK_EVENT_START_BLOCK = 46313342n;
const ARC_RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
const ARC_CHAIN_ID = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "5042002", 10);
const ARC_EXPLORER_URL = (process.env.NEXT_PUBLIC_EXPLORER_URL || "https://testnet.arcscan.app").replace(/\/$/, "");
const arcTestnet = {
  id: Number.isFinite(ARC_CHAIN_ID) ? ARC_CHAIN_ID : 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [ARC_RPC_URL]
    }
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: ARC_EXPLORER_URL
    }
  },
  testnet: true
} as const;

type TriggerResult = {
  owner: Address;
  txHash?: Hex;
  status: "triggered" | "dry-run" | "failed";
  error?: string;
};

export async function GET(request: NextRequest) {
  const authError = authorizeCronRequest(request);
  if (authError) return authError;

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress || !isAddress(contractAddress)) {
    return NextResponse.json({ error: "NEXT_PUBLIC_CONTRACT_ADDRESS is not configured." }, { status: 500 });
  }

  const rawBotPk = process.env.TRIGGER_BOT_PRIVATE_KEY;
  const botPrivateKey = normalizePrivateKey(rawBotPk);
  if (!botPrivateKey) {
    return NextResponse.json(
      {
        error: "TRIGGER_BOT_PRIVATE_KEY is not configured or has invalid format.",
        rawLength: rawBotPk?.length ?? 0
      },
      { status: 500 }
    );
  }

  let botWallet: ethers.Wallet;
  try {
    botWallet = new ethers.Wallet(botPrivateKey, new ethers.providers.JsonRpcProvider(ARC_RPC_URL));
  } catch (pkErr) {
    return NextResponse.json(
      {
        error: "Invalid TRIGGER_BOT_PRIVATE_KEY",
        detail: pkErr instanceof Error ? pkErr.message : String(pkErr)
      },
      { status: 500 }
    );
  }

  const botAddress = botWallet.address as Address;
  const vaultWithBot = new ethers.Contract(
    contractAddress,
    ["function activateTrigger(address user) external"],
    botWallet
  );

  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http(ARC_RPC_URL)
  });

  const latestBlock = await publicClient.getBlockNumber();
  const chunkSize = readBigIntEnv("AUTO_TRIGGER_BLOCK_CHUNK_SIZE", DEFAULT_BLOCK_CHUNK_SIZE);
  const maxChunks = readNumberEnv("AUTO_TRIGGER_MAX_CHUNKS", DEFAULT_MAX_CHUNKS);
  const maxTx = readNumberEnv("AUTO_TRIGGER_MAX_TX", DEFAULT_MAX_TX);
  const dryRun = process.env.AUTO_TRIGGER_DRY_RUN === "true";
  const configuredStartBlock = readBigIntEnv(
    "AUTO_TRIGGER_FROM_BLOCK",
    readBigIntEnv("NEXT_PUBLIC_EVENT_START_BLOCK", FALLBACK_EVENT_START_BLOCK)
  );
  const capacity = chunkSize * BigInt(maxChunks);
  const fromBlock =
    configuredStartBlock > latestBlock
      ? latestBlock
      : latestBlock - configuredStartBlock + 1n > capacity
        ? latestBlock - capacity + 1n
        : configuredStartBlock;

  const botBalance = await publicClient.getBalance({ address: botAddress });
  if (!dryRun && botBalance === 0n) {
    return NextResponse.json(
      {
        error: "Trigger bot wallet has no Arc USDC for gas.",
        bot: botAddress,
        balance: "0"
      },
      { status: 500 }
    );
  }

  const owners = await findVaultOwners(publicClient, contractAddress, fromBlock, latestBlock, chunkSize, maxChunks);
  const results: TriggerResult[] = [];
  let expiredFound = 0;

  for (const owner of owners) {
    if (results.filter((result) => result.status === "triggered" || result.status === "dry-run").length >= maxTx) {
      break;
    }

    const statusCode = Number(
      await publicClient.readContract({
        address: contractAddress,
        abi: OBSIDIAN_VAULT_ABI,
        functionName: "getStatus",
        args: [owner]
      })
    );

    if (statusCode !== STATUS_EXPIRED) continue;
    expiredFound += 1;

    if (dryRun) {
      results.push({ owner, status: "dry-run" });
      continue;
    }

    try {
      const tx = await vaultWithBot.activateTrigger(owner);
      await tx.wait(readNumberEnv("AUTO_TRIGGER_CONFIRMATIONS", 1));

      results.push({ owner, status: "triggered", txHash: tx.hash as Hex });
    } catch (caught) {
      results.push({
        owner,
        status: "failed",
        error: caught instanceof Error ? caught.message : "Unknown trigger error"
      });
    }
  }

  return NextResponse.json({
    ok: true,
    mode: dryRun ? "dry-run" : "execute",
    bot: botAddress,
    botBalance: `${Number(formatEther(botBalance)).toFixed(6)} USDC`,
    contract: contractAddress,
    scannedBlocks: {
      from: fromBlock.toString(),
      to: latestBlock.toString(),
      completeFromConfiguredStart: fromBlock === configuredStartBlock
    },
    vaultsFound: owners.length,
    expiredFound,
    maxTx,
    results
  });
}

function authorizeCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return null;

  const expected = `Bearer ${cronSecret}`;
  if (request.headers.get("authorization") === expected) return null;

  return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
}

async function findVaultOwners(
  publicClient: ReturnType<typeof createPublicClient>,
  contractAddress: Address,
  fromBlock: bigint,
  toBlock: bigint,
  chunkSize: bigint,
  maxChunks: number
): Promise<Address[]> {
  const owners = new Set<Address>();
  const event = getAbiItem({ abi: OBSIDIAN_VAULT_ABI, name: "VaultCreated" });
  let current = fromBlock;
  let chunks = 0;

  while (current <= toBlock && chunks < maxChunks) {
    const end = current + chunkSize - 1n < toBlock ? current + chunkSize - 1n : toBlock;
    const logs = await publicClient.getLogs({
      address: contractAddress,
      event,
      fromBlock: current,
      toBlock: end
    });

    for (const log of logs) {
      const owner = log.args?.user;
      if (typeof owner === "string" && isAddress(owner)) {
        owners.add(owner);
      }
    }

    current = end + 1n;
    chunks += 1;
  }

  return [...owners];
}

function normalizePrivateKey(value: string | undefined): Hex | null {
  if (!value) return null;

  // Strip ALL whitespace and control characters (\r, \n, spaces, tabs)
  const cleaned = value.replace(/[\s\r\n\t]/g, "");
  const withPrefix = cleaned.startsWith("0x") ? cleaned : `0x${cleaned}`;
  return /^0x[a-fA-F0-9]{64}$/.test(withPrefix) ? (withPrefix as Hex) : null;
}

function readNumberEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBigIntEnv(name: string, fallback: bigint) {
  try {
    const value = process.env[name];
    return value ? BigInt(value) : fallback;
  } catch {
    return fallback;
  }
}
