"use client";

import { ExternalLink } from "lucide-react";
import type { Address } from "viem";
import { FAUCET_URL } from "@/lib/app-kit-config";

type UnifiedBalanceProps = {
  userAddress?: Address;
};

export function UnifiedBalance({ userAddress }: UnifiedBalanceProps) {
  return (
    <div className="terminal-border space-y-4 bg-typeui-surface p-4 text-typeui-night">
      <div className="border-b border-typeui-secondary/40 pb-3">
        <h3 className="text-lg font-bold uppercase">GET TESTNET USDC</h3>
      </div>

      <p className="text-sm leading-6">You need USDC on Arc Testnet for gas.</p>

      <a
        href={FAUCET_URL}
        target="_blank"
        rel="noreferrer"
        className="terminal-border inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-bold uppercase hover:bg-typeui-night hover:text-typeui-cream"
      >
        GET FREE USDC AT FAUCET.CIRCLE.COM
        <ExternalLink size={15} aria-hidden="true" />
      </a>

      <div className="space-y-2 border border-typeui-secondary/50 p-3 text-sm font-bold uppercase leading-6">
        <p>Steps:</p>
        <p>1. Go to faucet.circle.com</p>
        <p>2. Enter your wallet address: {userAddress ?? "Connect wallet first"}</p>
        <p>3. Select Arc Testnet</p>
        <p>4. Receive USDC instantly</p>
        <p>5. Return here and deploy your vault</p>
      </div>
    </div>
  );
}
