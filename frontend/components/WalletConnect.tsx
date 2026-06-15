"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PlugZap, RefreshCw, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useSwitchChain } from "wagmi";
import { addArcNetwork, switchToArcTestnet } from "@/lib/wallet-network";

export function WalletConnect() {
  const { switchChainAsync } = useSwitchChain();

  async function handleConnectWallet(openConnectModal: () => void) {
    try {
      await addArcNetwork();
    } catch {
      console.error("[obsidian] wallet preparation failed");
    }

    openConnectModal();
  }

  async function handleSwitchToArc() {
    try {
      await switchToArcTestnet(switchChainAsync);
    } catch {
      console.error("[obsidian] wallet network switch failed");
    }
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!connected) {
          return (
            <div className="flex justify-start sm:justify-end" aria-hidden={!ready}>
              <WalletButton onClick={() => handleConnectWallet(openConnectModal)} title="Connect wallet">
                <PlugZap size={16} aria-hidden="true" />
                CONNECT WALLET
              </WalletButton>
            </div>
          );
        }

        if (chain.unsupported) {
          return (
            <div className="flex justify-start sm:justify-end" aria-hidden={!ready}>
              <WalletButton onClick={handleSwitchToArc} title="Switch to Arc Testnet">
                <RefreshCw size={16} aria-hidden="true" />
                SWITCH TO ARC TESTNET
              </WalletButton>
            </div>
          );
        }

        return (
          <div className="flex flex-wrap justify-start gap-2 sm:justify-end" aria-hidden={!ready}>
            <WalletButton onClick={openChainModal} title="Change network">
              {chain.name ?? "ARC"}
            </WalletButton>
            <WalletButton onClick={openAccountModal} title="Wallet account">
              <Wallet size={16} aria-hidden="true" />
              {account.displayName}
            </WalletButton>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

function WalletButton({
  children,
  onClick,
  title
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap border border-typeui-primary bg-typeui-primary px-5 text-sm font-bold uppercase text-typeui-night transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-typeui-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-secondary disabled:opacity-60"
      title={title}
    >
      {children}
    </button>
  );
}
