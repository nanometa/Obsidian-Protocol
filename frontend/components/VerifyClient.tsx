"use client";

import { Download, Search, ShieldAlert } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { Address, Hash } from "viem";
import { isAddress } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AppHeader } from "./AppHeader";
import { Terminal } from "./Terminal";
import { VaultStatus } from "./VaultStatus";
import { useVault } from "@/hooks/useVault";
import { OBSIDIAN_VAULT_ABI } from "@/lib/contract";
import { OBSIDIAN_VAULT_ADDRESS, arcTestnet, explorerTxUrl } from "@/lib/arc-config";
import { ipfsToGatewayUrl } from "@/lib/ipfs";
import { DecryptVaultPanel } from "./DecryptVaultPanel";

export function VerifyClient() {
  const [input, setInput] = useState("");
  const [ownerAddress, setOwnerAddress] = useState<string | undefined>();
  const { vault, status, history, isLoading, error, refetch } = useVault(ownerAddress);
  const { writeContractAsync, isPending, error: triggerError } = useWriteContract();
  const [triggerHash, setTriggerHash] = useState<Hash | undefined>();
  const receipt = useWaitForTransactionReceipt({
    hash: triggerHash,
    chainId: arcTestnet.id,
    confirmations: 1
  });
  const sanitizedInput = sanitizeAddress(input);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOwnerAddress(sanitizedInput || undefined);
  }

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

  useEffect(() => {
    if (receipt.isSuccess) refetch();
  }, [receipt.isSuccess, refetch]);

  useEffect(() => {
    if (!sanitizedInput) {
      setOwnerAddress(undefined);
      return;
    }

    const debounce = setTimeout(() => {
      setOwnerAddress(sanitizedInput);
    }, 500);

    return () => clearTimeout(debounce);
  }, [sanitizedInput]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-typeui-base px-4 py-6 text-typeui-text sm:px-6 lg:px-8">
      <AppHeader title="PUBLIC VERIFY" />

      <Terminal title="LOOKUP">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
          <input
            value={input}
            onChange={(event) => setInput(sanitizeAddress(event.target.value))}
            placeholder="0x vault owner address"
            className="min-h-12 flex-1 border border-obsidian-green/30 bg-obsidian-black px-3 text-sm text-obsidian-white outline-none focus:border-obsidian-green"
          />
          <button
            type="submit"
            className="terminal-border inline-flex min-h-12 items-center justify-center gap-2 px-4 font-bold text-obsidian-green hover:bg-obsidian-green hover:text-obsidian-black"
            title="Verify vault"
          >
            <Search size={18} />
            VERIFY
          </button>
        </form>
      </Terminal>

      <div className="mt-5 space-y-5">
        {!ownerAddress ? (
          <Terminal title="PUBLIC VAULT VERIFICATION">
            <div className="space-y-4 text-sm leading-6">
              <p className="font-bold uppercase text-obsidian-white">Enter a vault owner address to verify public state.</p>
              <div className="grid gap-2 text-obsidian-dim">
                <p>- Check whether a vault exists.</p>
                <p>- See current status and deadline.</p>
                <p>- Download the encrypted file.</p>
                <p>- Verify the IPFS hash stored on-chain.</p>
              </div>
              <p className="font-bold uppercase text-obsidian-green">This page is public. No wallet is required to verify a vault.</p>
              <div className="border border-obsidian-green/30 p-3 text-xs uppercase text-obsidian-dim">
                Example use cases: journalist verification, NGO document checks, or confirming that a protected vault exists.
              </div>
            </div>
          </Terminal>
        ) : null}

        {ownerAddress && !isAddress(ownerAddress) ? (
          <Terminal title="ADDRESS ERROR">
            <p className="break-words text-obsidian-warning">INVALID ADDRESS: {ownerAddress}</p>
          </Terminal>
        ) : null}

        {isLoading ? (
          <Terminal title="LOADING">
            <p className="cursor-blink">READING VAULT STATUS</p>
          </Terminal>
        ) : null}

        {error ? (
          <Terminal title="ERROR">
            <p className="break-words text-obsidian-warning">{error}</p>
          </Terminal>
        ) : null}

        {ownerAddress && !isLoading && !vault && !error && isAddress(ownerAddress) ? (
          <Terminal title="NO VAULT">
            <p className="text-obsidian-dim">NO VAULT FOUND</p>
          </Terminal>
        ) : null}

        {vault ? (
          <>
            <Terminal title="VERIFICATION RESULT">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <VaultStatus status={status} />
                  <span className="text-xs text-obsidian-dim">{history.length} EVENT(S)</span>
                </div>

                <div className="grid gap-3 text-sm">
                  <ResultRow label="OWNER" value={vault.owner} />
                  <ResultRow label="IPFS" value={vault.ipfsHash} />
                  <ResultRow label="DEADLINE" value={new Date(Number(vault.deadline) * 1000).toISOString()} />
                </div>

                <div className="grid gap-3 border border-obsidian-green/30 p-3">
                  <KeyPartBlock label="KEY PART A" value={vault.encryptedKeyPartA || "NONE"} />
                  <KeyPartBlock
                    label="KEY PART B"
                    value={vault.encryptedKeyPartB || "LOCKED - awaiting trigger"}
                    locked={!vault.encryptedKeyPartB}
                  />
                  <p className="text-xs font-bold uppercase leading-5 text-obsidian-dim">
                    {status === "TRIGGERED"
                      ? "DOCUMENTS RELEASED. DECRYPT BELOW."
                      : "VAULT NOT YET TRIGGERED. DOCUMENTS LOCKED UNTIL TIMER EXPIRES."}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href={ipfsToGatewayUrl(vault.ipfsHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="terminal-border inline-flex min-h-12 flex-1 items-center justify-center gap-2 px-4 font-bold text-obsidian-white hover:bg-obsidian-white hover:text-obsidian-black"
                  >
                    <Download size={18} />
                    DOWNLOAD ENCRYPTED FILE
                  </a>
                  <button
                    type="button"
                    onClick={activateTrigger}
                    disabled={status !== "EXPIRED" || isPending || receipt.isLoading}
                    className="terminal-border inline-flex min-h-12 flex-1 items-center justify-center gap-2 px-4 font-bold text-obsidian-warning hover:bg-obsidian-warning hover:text-obsidian-black disabled:cursor-not-allowed disabled:opacity-50"
                    title="Activate trigger"
                  >
                    <ShieldAlert size={18} />
                    ACTIVATE TRIGGER
                  </button>
                </div>

                {triggerHash ? (
                  <div className="terminal-border p-3 text-xs">
                    <div className="text-obsidian-dim">TRIGGER TX</div>
                    <a className="break-all text-obsidian-white hover:text-obsidian-green" href={explorerTxUrl(triggerHash)} target="_blank" rel="noreferrer">
                      {triggerHash}
                    </a>
                  </div>
                ) : null}

                {triggerError ? <p className="break-words text-xs text-obsidian-warning">{triggerError.message}</p> : null}
              </div>
            </Terminal>

            {status === "TRIGGERED" ? (
              <DecryptVaultPanel
                ipfsHash={vault.ipfsHash}
                encryptedKeyPartA={vault.encryptedKeyPartA}
                encryptedKeyPartB={vault.encryptedKeyPartB}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}

function sanitizeAddress(input: string): string {
  return input.trim().toLowerCase();
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

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3">
      <span className="text-obsidian-dim">{label}</span>
      <span className="min-w-0 break-all text-obsidian-white">{value}</span>
    </div>
  );
}
