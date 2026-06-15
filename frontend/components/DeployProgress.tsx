"use client";

import { ExternalLink, RotateCcw } from "lucide-react";
import type { Hash } from "viem";
import type { SmartDeployStatus } from "@/lib/smart-deploy";
import { explorerTxUrl } from "@/lib/arc-config";
import { FAUCET_URL } from "@/lib/app-kit-config";

type DeployProgressProps = {
  status: SmartDeployStatus;
  txHash?: Hash;
  onRetry?: () => void;
};

const STEPS = [
  { stage: "checking", label: "Check balance" },
  { stage: "deploying", label: "Deploy vault" },
  { stage: "success", label: "Complete" }
] as const;

const STAGE_TITLES: Record<SmartDeployStatus["stage"], string> = {
  idle: "READY TO DEPLOY",
  checking: "CHECK BALANCE",
  deploying: "DEPLOYING VAULT",
  success: "VAULT DEPLOYED",
  error: "DEPLOY ERROR"
};

export function DeployProgress({ status, txHash, onRetry }: DeployProgressProps) {
  const displayHash = status.txHash ?? txHash;
  const isError = status.stage === "error";

  return (
    <div className="terminal-border space-y-3 p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`font-bold uppercase ${isError ? "text-obsidian-warning" : "text-obsidian-white"}`}>
          {STAGE_TITLES[status.stage]}
        </span>
        <span className="font-bold text-obsidian-dim">{status.progress}%</span>
      </div>

      <div className="font-mono text-obsidian-green">{renderBar(status.progress)}</div>

      <p className={`break-words leading-5 ${isError ? "text-obsidian-warning" : "text-obsidian-dim"}`}>
        {status.message}
      </p>

      {status.stage === "deploying" ? (
        <p className="text-obsidian-dim">Please confirm in MetaMask.</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        {STEPS.map((step, index) => {
          const active = status.stage === step.stage;
          const complete = getStepIndex(status.stage) > index || status.stage === "success";

          return (
            <div
              key={step.stage}
              className={`border px-2 py-1 font-bold uppercase ${
                active
                  ? "border-obsidian-green bg-obsidian-green text-obsidian-black"
                  : complete
                    ? "border-obsidian-green/50 text-obsidian-green"
                    : "border-obsidian-green/20 text-obsidian-dim"
              }`}
            >
              {index + 1}. {step.label}
            </div>
          );
        })}
      </div>

      {displayHash ? (
        <a
          className="inline-flex min-h-10 items-center gap-2 break-all font-bold uppercase text-obsidian-white hover:text-obsidian-green"
          href={explorerTxUrl(displayHash)}
          target="_blank"
          rel="noreferrer"
        >
          View on ArcScan
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      ) : null}

      {isError ? (
        <div className="flex flex-wrap gap-2">
          {status.errorCode === "NO_USDC" ? (
            <a
              href={FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="terminal-border inline-flex min-h-10 items-center justify-center gap-2 px-3 font-bold uppercase text-obsidian-white hover:bg-obsidian-white hover:text-obsidian-black"
            >
              Get testnet USDC
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : null}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="terminal-border inline-flex min-h-10 items-center justify-center gap-2 px-3 font-bold uppercase text-obsidian-green hover:bg-obsidian-green hover:text-obsidian-black"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function renderBar(progress: number) {
  const normalized = Math.max(0, Math.min(100, progress));
  const filled = Math.round(normalized / 10);
  return `[${"#".repeat(filled)}${"-".repeat(10 - filled)}] ${normalized}%`;
}

function getStepIndex(stage: SmartDeployStatus["stage"]) {
  return STEPS.findIndex((step) => step.stage === stage);
}
