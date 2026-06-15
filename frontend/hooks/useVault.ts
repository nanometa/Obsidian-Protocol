"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address, Hash } from "viem";
import { getAbiItem, isAddress } from "viem";
import { usePublicClient } from "wagmi";
import { OBSIDIAN_VAULT_ADDRESS, arcTestnet } from "@/lib/arc-config";
import { OBSIDIAN_VAULT_ABI, STATUS_LABELS, type VaultStatusLabel } from "@/lib/contract";

export type VaultRecord = {
  exists: boolean;
  owner: Address;
  ipfsHash: string;
  encryptedKeyPartA: string;
  encryptedKeyPartB: string;
  timerDuration: bigint;
  createdAt: bigint;
  lastHeartbeat: bigint;
  deadline: bigint;
  triggered: boolean;
  triggeredAt: bigint;
  beneficiaries: Address[];
};

export type VaultHistoryItem = {
  type: "VaultCreated" | "HeartbeatSent" | "TriggerActivated";
  transactionHash: Hash;
  blockNumber: bigint;
};

type VaultTuple = readonly [
  boolean,
  Address,
  string,
  string,
  string,
  bigint,
  bigint,
  bigint,
  bigint,
  boolean,
  bigint,
  readonly Address[]
];

const LOG_CHUNK_SIZE = 9000n;
const MAX_EVENTS = 50;
const RPC_TIMEOUT_MS = 10000;
const FALLBACK_EVENT_START_BLOCK = "46313342";
const VAULT_CACHE_TTL_MS = 30000;

type VaultEventName = VaultHistoryItem["type"];
type VaultCacheEntry = {
  timestamp: number;
  vault: VaultRecord | null;
  status: VaultStatusLabel;
  history: VaultHistoryItem[];
};

const vaultCache = new Map<string, VaultCacheEntry>();

const VAULT_EVENTS = {
  VaultCreated: getAbiItem({ abi: OBSIDIAN_VAULT_ABI, name: "VaultCreated" }),
  HeartbeatSent: getAbiItem({ abi: OBSIDIAN_VAULT_ABI, name: "HeartbeatSent" }),
  TriggerActivated: getAbiItem({ abi: OBSIDIAN_VAULT_ABI, name: "TriggerActivated" })
} as const;

export function useVault(ownerAddress: string | undefined) {
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const [vault, setVault] = useState<VaultRecord | null>(null);
  const [status, setStatus] = useState<VaultStatusLabel>("NONE");
  const [history, setHistory] = useState<VaultHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const validOwner = useMemo(() => (ownerAddress && isAddress(ownerAddress) ? (ownerAddress as Address) : undefined), [
    ownerAddress
  ]);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function loadVault() {
      if (!publicClient || !validOwner) {
        setVault(null);
        setStatus("NONE");
        setHistory([]);
        return;
      }

      if (!OBSIDIAN_VAULT_ADDRESS || !isAddress(OBSIDIAN_VAULT_ADDRESS)) {
        setError("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.");
        setVault(null);
        setStatus("NONE");
        setHistory([]);
        return;
      }

      const cacheKey = validOwner.toLowerCase();
      const cached = vaultCache.get(cacheKey);
      if (nonce === 0 && cached && Date.now() - cached.timestamp < VAULT_CACHE_TTL_MS) {
        setVault(cached.vault);
        setStatus(cached.status);
        setHistory(cached.history);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [vaultTuple, statusCode] = await Promise.all([
          withTimeout(
            publicClient.readContract({
              address: OBSIDIAN_VAULT_ADDRESS,
              abi: OBSIDIAN_VAULT_ABI,
              functionName: "getVault",
              args: [validOwner]
            }) as Promise<VaultTuple>
          ),
          withTimeout(
            publicClient.readContract({
              address: OBSIDIAN_VAULT_ADDRESS,
              abi: OBSIDIAN_VAULT_ABI,
              functionName: "getStatus",
              args: [validOwner]
            }) as Promise<number>
          )
        ]);

        if (cancelled) return;

        const nextVault: VaultRecord = {
          exists: vaultTuple[0],
          owner: vaultTuple[1],
          ipfsHash: vaultTuple[2],
          encryptedKeyPartA: vaultTuple[3],
          encryptedKeyPartB: vaultTuple[4],
          timerDuration: vaultTuple[5],
          createdAt: vaultTuple[6],
          lastHeartbeat: vaultTuple[7],
          deadline: vaultTuple[8],
          triggered: vaultTuple[9],
          triggeredAt: vaultTuple[10],
          beneficiaries: [...vaultTuple[11]]
        };

        setVault(nextVault.exists ? nextVault : null);
        const nextStatus = STATUS_LABELS[statusCode as keyof typeof STATUS_LABELS] || "NONE";
        setStatus(nextStatus);

        if (!nextVault.exists) {
          setHistory([]);
          vaultCache.set(cacheKey, {
            timestamp: Date.now(),
            vault: null,
            status: nextStatus,
            history: []
          });
          return;
        }

        let nextHistory: VaultHistoryItem[] = [];

        try {
          nextHistory = await loadVaultHistory(publicClient, validOwner);
        } catch (historyError) {
          console.warn("[obsidian] vault history load failed:", historyError);
        }

        if (cancelled) return;

        setHistory(nextHistory);
        vaultCache.set(cacheKey, {
          timestamp: Date.now(),
          vault: nextVault,
          status: nextStatus,
          history: nextHistory
        });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Failed to load vault.";
        console.error("[obsidian] vault load failed");
        if (!cancelled) {
          setError(message);
          setVault(null);
          setHistory([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadVault();

    return () => {
      cancelled = true;
    };
  }, [publicClient, validOwner, nonce]);

  return {
    vault,
    status,
    history,
    isLoading,
    error,
    refetch,
    isValidOwnerAddress: Boolean(validOwner)
  };
}

async function loadVaultHistory(publicClient: any, user: Address): Promise<VaultHistoryItem[]> {
  const startBlock = getEventStartBlock();
  const latestBlock = await withTimeout<bigint>(publicClient.getBlockNumber() as Promise<bigint>);

  if (startBlock > latestBlock) {
    return [];
  }

  const eventFilter = {
    address: OBSIDIAN_VAULT_ADDRESS,
    args: { user }
  };

  const [created, heartbeats, triggers] = await Promise.all([
    getLogsChunked(publicClient, { ...eventFilter, event: VAULT_EVENTS.VaultCreated }, startBlock, latestBlock),
    getLogsChunked(publicClient, { ...eventFilter, event: VAULT_EVENTS.HeartbeatSent }, startBlock, latestBlock),
    getLogsChunked(publicClient, { ...eventFilter, event: VAULT_EVENTS.TriggerActivated }, startBlock, latestBlock)
  ]);

  return [
    ...created.map((log) => toHistoryItem("VaultCreated", log.transactionHash, log.blockNumber)),
    ...heartbeats.map((log) => toHistoryItem("HeartbeatSent", log.transactionHash, log.blockNumber)),
    ...triggers.map((log) => toHistoryItem("TriggerActivated", log.transactionHash, log.blockNumber))
  ]
    .sort((a, b) => (a.blockNumber === b.blockNumber ? 0 : a.blockNumber > b.blockNumber ? -1 : 1))
    .slice(0, MAX_EVENTS);
}

async function getLogsChunked(
  publicClient: any,
  filter: any,
  fromBlock: bigint,
  toBlock: bigint,
  chunkSize: bigint = LOG_CHUNK_SIZE
) {
  const allLogs = [];
  let current = fromBlock;

  while (current <= toBlock) {
    const end = current + chunkSize - 1n < toBlock ? current + chunkSize - 1n : toBlock;

    try {
      const logs = await withTimeout<any[]>(
        publicClient.getLogs({
          ...filter,
          fromBlock: current,
          toBlock: end
        }) as Promise<any[]>
      );
      allLogs.push(...logs);
    } catch {
      console.warn("[obsidian] log chunk failed, skipping:", current.toString(), end.toString());
    }

    current = end + 1n;
  }

  return allLogs;
}

function getEventStartBlock() {
  try {
    return BigInt(process.env.NEXT_PUBLIC_EVENT_START_BLOCK ?? FALLBACK_EVENT_START_BLOCK);
  } catch {
    console.warn("[obsidian] invalid NEXT_PUBLIC_EVENT_START_BLOCK, falling back to deployment block");
    return BigInt(FALLBACK_EVENT_START_BLOCK);
  }
}

const withTimeout = <T>(promise: Promise<T>, ms: number = RPC_TIMEOUT_MS): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("RPC timeout")), ms);
    })
  ]);

function toHistoryItem(
  type: VaultEventName,
  transactionHash: Hash,
  blockNumber: bigint | null
): VaultHistoryItem {
  return {
    type,
    transactionHash,
    blockNumber: blockNumber || 0n
  };
}
