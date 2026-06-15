"use client";

import { useCallback, useMemo } from "react";
import type { Address } from "viem";
import { SUPPORTED_SOURCE_CHAINS, type SupportedSourceChainId } from "@/lib/app-kit-config";

export type BridgeStatus = "idle" | "error";

export type BridgeEstimate = {
  displayFee: string;
};

export type BridgeResultSummary = {
  depositTxHash?: string;
  spendTxHash?: string;
  explorerUrl?: string;
};

export type SourceUSDCBalance = {
  chain: (typeof SUPPORTED_SOURCE_CHAINS)[number];
  usdcBalance: string;
  nativeBalance: string;
  hasUSDC: boolean;
  hasNativeGas: boolean;
  error?: string;
};

export function useBridgeToArc() {
  const sourceBalances = useMemo<SourceUSDCBalance[]>(() => [], []);
  const scanSourceBalances = useCallback(async (_userAddress: Address) => [], []);
  const estimateBridge = useCallback(
    async (_sourceChain: SupportedSourceChainId, _amount: string, _recipientAddress: Address) => null,
    []
  );
  const bridge = useCallback(
    async (_sourceChain: SupportedSourceChainId, _amount: string, _recipientAddress: Address) => null,
    []
  );
  const reset = useCallback(() => {}, []);

  return {
    bridge,
    estimateBridge,
    scanSourceBalances,
    sourceBalances,
    isScanning: false,
    status: "idle" as BridgeStatus,
    error: null,
    txHash: null,
    result: null,
    reset
  };
}
