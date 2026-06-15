"use client";

import { AlertTriangle, ExternalLink, WalletCards } from "lucide-react";
import type { Address } from "viem";
import { erc20Abi, formatUnits, isAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";

const USDC_DECIMALS = 6;
const LOW_BALANCE_USDC = 0.05;
const FAUCET_URL = "https://faucet.circle.com";

export function useUSDCBalance(addressOverride?: Address) {
  const { address: connectedAddress } = useAccount();
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  const accountAddress = addressOverride ?? connectedAddress;
  const hasUsdcAddress = Boolean(usdcAddress && isAddress(usdcAddress));
  const shouldRead = Boolean(accountAddress && hasUsdcAddress);

  const balance = useReadContract({
    address: hasUsdcAddress ? (usdcAddress as Address) : undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: accountAddress ? [accountAddress] : undefined,
    query: {
      enabled: shouldRead,
      retry: 1
    }
  });

  const numericBalance = typeof balance.data === "bigint" ? Number(formatUnits(balance.data, USDC_DECIMALS)) : null;
  const isLowBalance = numericBalance !== null && numericBalance < LOW_BALANCE_USDC;

  return {
    balance: balance.data,
    displayBalance: numericBalance === null ? "--" : numericBalance.toFixed(2),
    numericBalance,
    isLoading: balance.isLoading || balance.isFetching,
    isLowBalance,
    isConfigured: hasUsdcAddress,
    error: balance.error
  };
}

export function USDCBalance() {
  const { isConnected } = useAccount();
  const { displayBalance, isLoading, isLowBalance, isConfigured } = useUSDCBalance();

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="inline-flex min-h-11 items-center gap-2 border border-typeui-secondary bg-typeui-surface px-3 font-bold uppercase text-typeui-night shadow-terminal">
        <WalletCards size={16} aria-hidden="true" />
        <span>{isConnected && isLoading ? "..." : displayBalance} USDC</span>
      </div>

      {isConnected && isConfigured && isLowBalance ? (
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-bold uppercase text-typeui-secondary hover:text-typeui-night"
        >
          <AlertTriangle size={13} aria-hidden="true" />
          LOW BALANCE
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}
