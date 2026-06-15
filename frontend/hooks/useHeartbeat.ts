"use client";

import { useState } from "react";
import type { Address, Hash } from "viem";
import { isAddress } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { OBSIDIAN_VAULT_ADDRESS, arcTestnet } from "@/lib/arc-config";
import { OBSIDIAN_VAULT_ABI } from "@/lib/contract";

export function useHeartbeat() {
  const [hash, setHash] = useState<Hash | undefined>();
  const { writeContractAsync, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId: arcTestnet.id,
    confirmations: 1
  });

  async function sendHeartbeat() {
    if (!OBSIDIAN_VAULT_ADDRESS || !isAddress(OBSIDIAN_VAULT_ADDRESS)) {
      throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.");
    }

    const txHash = await writeContractAsync({
      address: OBSIDIAN_VAULT_ADDRESS as Address,
      abi: OBSIDIAN_VAULT_ABI,
      functionName: "heartbeat"
    });
    setHash(txHash);
    return txHash;
  }

  return {
    sendHeartbeat,
    hash,
    isPending,
    error,
    receipt
  };
}
