"use client";

import { AlertTriangle, ExternalLink, RadioTower, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Address, Hash } from "viem";
import { isAddress } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AppHeader } from "./AppHeader";
import { CountdownTimer } from "./CountdownTimer";
import { Terminal } from "./Terminal";
import { VaultStatus } from "./VaultStatus";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useVault } from "@/hooks/useVault";
import { explorerAddressUrl, explorerTxUrl, OBSIDIAN_VAULT_ADDRESS, arcTestnet } from "@/lib/arc-config";
import { OBSIDIAN_VAULT_ABI } from "@/lib/contract";
import { estimateVaultGas } from "@/lib/gas-estimator";
import { ipfsToGatewayUrl } from "@/lib/ipfs";
import { DecryptVaultPanel } from "./DecryptVaultPanel";

type VaultDashboardClientProps = {
  ownerAddress: string;
};

export function VaultDashboardClient({ ownerAddress }: VaultDashboardClientProps) {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const { vault, status, history, isLoading, error, refetch, isValidOwnerAddress } = useVault(ownerAddress);
  const heartbeat = useHeartbeat();
  const [triggerHash, setTriggerHash] = useState<Hash | undefined>();
  const [heartbeatCost, setHeartbeatCost] = useState("~$0.01 USDC");
  const [isEstimatingHeartbeat, setIsEstimatingHeartbeat] = useState(false);
  const { writeContractAsync, isPending: isTriggering, error: triggerError } = useWriteContract();
  const triggerReceipt = useWaitForTransactionReceipt({
    hash: triggerHash,
    chainId: arcTestnet.id,
    confirmations: 1
  });

  const isOwner = Boolean(
    connectedAddress && vault?.owner && connectedAddress.toLowerCase() === vault.owner.toLowerCase()
  );

  const secondsRemaining = useMemo(() => {
    if (!vault) return 0;
    return Math.max(0, Number(vault.deadline) - Math.floor(Date.now() / 1000));
  }, [vault]);

  const urgent = status === "ACTIVE" && secondsRemaining > 0 && secondsRemaining < 48 * 60 * 60;

  useEffect(() => {
    if (heartbeat.receipt.isSuccess || triggerReceipt.isSuccess) refetch();
  }, [heartbeat.receipt.isSuccess, triggerReceipt.isSuccess, refetch]);

  useEffect(() => {
    let cancelled = false;

    async function refreshHeartbeatCost() {
      if (!connectedAddress || !isOwner || !OBSIDIAN_VAULT_ADDRESS || !isAddress(OBSIDIAN_VAULT_ADDRESS)) {
        setHeartbeatCost("~$0.01 USDC");
        setIsEstimatingHeartbeat(false);
        return;
      }

      setIsEstimatingHeartbeat(true);
      const estimate = await estimateVaultGas(
        publicClient,
        OBSIDIAN_VAULT_ADDRESS,
        OBSIDIAN_VAULT_ABI,
        "heartbeat",
        [] as const,
        connectedAddress
      );

      if (!cancelled) {
        setHeartbeatCost(estimate);
        setIsEstimatingHeartbeat(false);
      }
    }

    refreshHeartbeatCost();

    return () => {
      cancelled = true;
    };
  }, [connectedAddress, isOwner, publicClient]);

  async function activateTrigger() {
    if (!vault) return;
    if (!OBSIDIAN_VAULT_ADDRESS || !isAddress(OBSIDIAN_VAULT_ADDRESS)) {
      throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.");
    }

    const hash = await writeContractAsync({
      address: OBSIDIAN_VAULT_ADDRESS,
      abi: OBSIDIAN_VAULT_ABI,
      functionName: "activateTrigger",
      args: [vault.owner as Address]
    });
    setTriggerHash(hash);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-typeui-base px-4 py-6 text-typeui-text sm:px-6 lg:px-8">
      <AppHeader title="VAULT DASHBOARD" />

      {!isValidOwnerAddress ? (
        <Terminal title="ADDRESS ERROR">
          <p className="break-words text-obsidian-warning">INVALID VAULT OWNER ADDRESS: {ownerAddress}</p>
        </Terminal>
      ) : null}

      {isLoading ? (
        <Terminal title="LOADING">
          <p className="cursor-blink">READING ARC TESTNET</p>
        </Terminal>
      ) : null}

      {error ? (
        <Terminal title="ERROR">
          <p className="break-words text-obsidian-warning">{error}</p>
        </Terminal>
      ) : null}

      {!isLoading && !vault && isValidOwnerAddress && !error ? (
        <Terminal title="NO VAULT">
          <p className="break-words text-obsidian-dim">NO VAULT REGISTERED FOR {ownerAddress}</p>
        </Terminal>
      ) : null}

      {vault ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-5">
            <Terminal title="COUNTDOWN">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <VaultStatus status={status} />
                {urgent ? (
                  <span className="inline-flex min-h-8 items-center gap-2 border border-obsidian-warning px-3 text-xs font-bold text-obsidian-warning">
                    <AlertTriangle size={15} />
                    DEADLINE &lt; 48H
                  </span>
                ) : null}
              </div>
              <CountdownTimer deadline={vault.deadline} />
              {status === "EXPIRED" ? (
                <div className="mt-5 border border-obsidian-warning p-3 text-sm text-obsidian-warning">
                  TIMER EXPIRED. RELEASE CAN BE ACTIVATED BY ANY ADDRESS.
                </div>
              ) : null}
            </Terminal>

            <Terminal title="CONTROL">
              {isOwner ? (
                <div className="mb-3 terminal-border px-3 py-2 text-xs font-bold uppercase text-obsidian-white">
                  HEARTBEAT COST: {isEstimatingHeartbeat ? "ESTIMATING..." : heartbeatCost}
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {isOwner ? (
                  <button
                    type="button"
                    onClick={() => heartbeat.sendHeartbeat()}
                    disabled={status !== "ACTIVE" || heartbeat.isPending || heartbeat.receipt.isLoading}
                    className="terminal-border inline-flex min-h-12 items-center justify-center gap-2 bg-obsidian-green px-4 font-bold text-obsidian-black hover:bg-obsidian-white disabled:cursor-not-allowed disabled:opacity-50"
                    title="Send heartbeat"
                  >
                    <RadioTower size={18} />
                    SEND HEARTBEAT
                  </button>
                ) : (
                  <div className="terminal-border flex min-h-12 items-center justify-center px-4 text-center text-xs font-bold text-obsidian-dim">
                    CONNECT THE VAULT OWNER WALLET TO SEND HEARTBEAT
                  </div>
                )}
                <button
                  type="button"
                  onClick={activateTrigger}
                  disabled={status !== "EXPIRED" || isTriggering || triggerReceipt.isLoading}
                  className="terminal-border inline-flex min-h-12 items-center justify-center gap-2 px-4 font-bold text-obsidian-warning hover:bg-obsidian-warning hover:text-obsidian-black disabled:cursor-not-allowed disabled:opacity-50"
                  title="Activate trigger"
                >
                  <ShieldAlert size={18} />
                  ACTIVATE TRIGGER
                </button>
              </div>
              {heartbeat.hash ? <TxLine label="HEARTBEAT TX" hash={heartbeat.hash} /> : null}
              {triggerHash ? <TxLine label="TRIGGER TX" hash={triggerHash} /> : null}
              {heartbeat.error || triggerError ? (
                <p className="mt-3 break-words text-xs text-obsidian-warning">
                  {heartbeat.error?.message || triggerError?.message}
                </p>
              ) : null}
            </Terminal>

            <Terminal title="TRANSACTION HISTORY">
              {history.length === 0 ? (
                <p className="text-sm text-obsidian-dim">NO EVENTS FOUND</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <a
                      key={`${item.type}-${item.transactionHash}-${item.blockNumber.toString()}`}
                      className="terminal-border flex min-h-12 items-center justify-between gap-3 px-3 text-xs hover:bg-obsidian-green hover:text-obsidian-black"
                      href={explorerTxUrl(item.transactionHash)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>{item.type}</span>
                      <span className="truncate text-right">BLOCK {item.blockNumber.toString()}</span>
                    </a>
                  ))}
                </div>
              )}
            </Terminal>
          </div>

          <div className="space-y-5">
            <Terminal title="VAULT RECORD">
              <div className="space-y-3 text-sm">
                <DataRow label="OWNER" value={vault.owner} />
                <DataRow label="IPFS" value={vault.ipfsHash} href={ipfsToGatewayUrl(vault.ipfsHash)} />
                <DataRow label="TIMER" value={`${Number(vault.timerDuration) / 86400} DAYS`} />
                <DataRow label="CREATED AT" value={new Date(Number(vault.createdAt) * 1000).toISOString()} />
                <DataRow label="LAST HEARTBEAT" value={new Date(Number(vault.lastHeartbeat) * 1000).toISOString()} />
                <DataRow label="DEADLINE" value={new Date(Number(vault.deadline) * 1000).toISOString()} />
                {vault.triggeredAt > 0n ? (
                  <DataRow label="TRIGGERED AT" value={new Date(Number(vault.triggeredAt) * 1000).toISOString()} />
                ) : null}
              </div>
            </Terminal>

            <Terminal title="KEY RELEASE">
              <div className="space-y-3">
                <KeyPartBlock label="KEY PART A" value={vault.encryptedKeyPartA || "NONE"} />
                <KeyPartBlock
                  label="KEY PART B"
                  value={vault.encryptedKeyPartB || "LOCKED - awaiting trigger"}
                  locked={!vault.encryptedKeyPartB}
                />
                <p className="text-xs font-bold uppercase leading-5 text-obsidian-dim">
                  {status === "TRIGGERED"
                    ? "DOCUMENTS RELEASED. DECRYPT BELOW."
                    : "DOCUMENTS LOCKED UNTIL TIMER EXPIRES."}
                </p>
              </div>
            </Terminal>

            <Terminal title="BENEFICIARIES">
              <div className="space-y-2">
                {vault.beneficiaries.map((beneficiary) => (
                  <a
                    key={beneficiary}
                    className="block break-all border border-obsidian-green/30 p-2 text-xs text-obsidian-white hover:border-obsidian-green hover:text-obsidian-green"
                    href={explorerAddressUrl(beneficiary)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {beneficiary}
                  </a>
                ))}
              </div>
            </Terminal>

            {status === "TRIGGERED" ? (
              <DecryptVaultPanel
                ipfsHash={vault.ipfsHash}
                encryptedKeyPartA={vault.encryptedKeyPartA}
                encryptedKeyPartB={vault.encryptedKeyPartB}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function KeyPartBlock({ label, value, locked = false }: { label: string; value: string; locked?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-xs font-bold uppercase text-obsidian-dim">{label}</div>
      <textarea
        value={value}
        readOnly
        rows={locked ? 2 : 4}
        className={`w-full resize-y border p-2 font-mono text-xs outline-none ${
          locked
            ? "border-obsidian-warning/60 bg-obsidian-black text-obsidian-warning"
            : "border-obsidian-green/30 bg-obsidian-black text-obsidian-white"
        }`}
      />
    </div>
  );
}

function DataRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3">
      <span className="text-obsidian-dim">{label}</span>
      {href ? (
        <a className="min-w-0 break-all text-obsidian-white hover:text-obsidian-green" href={href} target="_blank" rel="noreferrer">
          {value}
          <ExternalLink className="ml-2 inline" size={13} />
        </a>
      ) : (
        <span className="min-w-0 break-words text-obsidian-white">{value}</span>
      )}
    </div>
  );
}

function TxLine({ label, hash }: { label: string; hash: string }) {
  return (
    <div className="mt-3 terminal-border p-3 text-xs">
      <div className="text-obsidian-dim">{label}</div>
      <a className="break-all text-obsidian-white hover:text-obsidian-green" href={explorerTxUrl(hash)} target="_blank" rel="noreferrer">
        {hash}
      </a>
    </div>
  );
}
