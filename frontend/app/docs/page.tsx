"use client";

import { BookOpenText, CircleDollarSign, Fuel, Gift, MapIcon, WalletCards } from "lucide-react";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DocsTab } from "@/components/docs/DocsTab";
import { RoadmapTab } from "@/components/docs/RoadmapTab";

type DocsView = "documentation" | "roadmap" | "payment";

const tabs = [
  { id: "documentation", label: "DOCUMENTATION", icon: BookOpenText },
  { id: "roadmap", label: "ROADMAP", icon: MapIcon },
  { id: "payment", label: "PAYMENT", icon: CircleDollarSign }
] as const;

export default function DocumentationPage() {
  const [activeView, setActiveView] = useState<DocsView>("documentation");

  return (
    <main className="min-h-screen bg-typeui-base px-4 py-6 text-typeui-text sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <AppHeader title="Documentation" />

        <section className="mb-6 border border-typeui-primary/45 bg-typeui-night p-4 text-typeui-cream shadow-terminal sm:p-6">
          <p className="text-xs font-bold uppercase text-typeui-primary">Obsidian Protocol / Reference</p>
          <h2 className="mt-3 text-3xl font-bold uppercase leading-tight text-typeui-cream sm:text-4xl">
            Documentation
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-typeui-cream">
            Everything you need to understand, trust, and use Obsidian Protocol.
          </p>

          <div className="mt-5 grid gap-2 sm:inline-grid sm:grid-cols-3" role="tablist" aria-label="Documentation tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveView(tab.id)}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 border px-4 text-sm font-bold uppercase transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-primary ${
                    isActive
                      ? "border-typeui-primary bg-typeui-primary text-typeui-night"
                      : "border-typeui-primary/50 bg-transparent text-typeui-cream hover:border-typeui-primary hover:text-typeui-primary"
                  }`}
                >
                  <Icon size={17} aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {activeView === "documentation" ? <DocsTab /> : null}
        {activeView === "roadmap" ? <RoadmapTab /> : null}
        {activeView === "payment" ? <PaymentModelTab /> : null}
      </div>
    </main>
  );
}

function PaymentModelTab() {
  return (
    <section className="space-y-5">
      <div className="border border-typeui-primary/45 bg-typeui-night p-5 text-typeui-cream shadow-terminal sm:p-6">
        <p className="text-xs font-bold uppercase text-typeui-primary">Arc Testnet / Payment Model</p>
        <h2 className="mt-3 text-2xl font-bold uppercase text-typeui-cream">USDC-Native Vault Operations</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-typeui-cream">
          Obsidian Protocol displays all network costs in USDC. Arc uses USDC for native gas, so vault owners do not need
          a separate volatile gas token to create a vault, send a heartbeat, or activate a trigger.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="border border-typeui-secondary bg-typeui-surface p-4 text-typeui-night shadow-terminal">
          <Fuel size={24} aria-hidden="true" />
          <h3 className="mt-3 text-lg font-bold uppercase">Gas Fees</h3>
          <p className="mt-2 text-sm leading-6">
            Create vault, heartbeat, and trigger transactions are estimated around $0.01 USDC. Arc smooths stable fees
            with EWMA and sets a hard ceiling that never exceeds $0.001 per gas unit.
          </p>
          <a
            href="https://docs.arc.io/arc/concepts/stable-fee-design"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-xs font-bold uppercase text-typeui-secondary hover:text-typeui-night"
          >
            Stable fee design
          </a>
        </article>

        <article className="border border-typeui-secondary bg-typeui-surface p-4 text-typeui-night shadow-terminal">
          <WalletCards size={24} aria-hidden="true" />
          <h3 className="mt-3 text-lg font-bold uppercase">No ETH Required</h3>
          <p className="mt-2 text-sm leading-6">
            Arc wallets pay gas in USDC. The app shows balances and estimates in USDC only, with a low-balance warning
            and a faucet link for testnet funding.
          </p>
        </article>

        <article className="border border-typeui-secondary bg-typeui-surface p-4 text-typeui-night shadow-terminal">
          <Gift size={24} aria-hidden="true" />
          <h3 className="mt-3 text-lg font-bold uppercase">NGO Sponsorship</h3>
          <p className="mt-2 text-sm leading-6">
            Organizations can obtain sponsorship codes for at-risk users and public-interest disclosure workflows.
            Contact security@obsidian-protocol.xyz.
          </p>
        </article>
      </div>

      <div className="border border-typeui-secondary bg-typeui-night p-5 text-typeui-cream shadow-terminal sm:p-6">
        <p className="text-xs font-bold uppercase text-typeui-primary">Coming / Unified Balance</p>
        <h3 className="mt-3 text-xl font-bold uppercase">Fund Arc Wallets From Other Chains</h3>
        <p className="mt-3 max-w-3xl text-sm leading-7">
          Circle App Kit Unified Balance is planned for one-click Arc wallet funding from chains such as Ethereum, Base,
          and Arbitrum through Circle infrastructure and CCTP support. In the current frontend, this is experimental UI
          only; vault encryption, IPFS payloads, and ObsidianVault contract calls never pass through App Kit.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold uppercase">
          <a
            href="https://docs.arc.io/app-kit/unified-balance"
            target="_blank"
            rel="noreferrer"
            className="border border-typeui-primary px-3 py-2 text-typeui-primary hover:bg-typeui-primary hover:text-typeui-night"
          >
            Unified Balance source
          </a>
          <a
            href="https://docs.arc.io/app-kit/references/supported-blockchains"
            target="_blank"
            rel="noreferrer"
            className="border border-typeui-primary px-3 py-2 text-typeui-primary hover:bg-typeui-primary hover:text-typeui-night"
          >
            Supported chains source
          </a>
        </div>
      </div>
    </section>
  );
}
