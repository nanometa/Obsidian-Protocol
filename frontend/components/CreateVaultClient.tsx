"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, Check, Copy, ExternalLink, Gift, KeyRound, Loader2, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Address, Hash } from "viem";
import { isAddress } from "viem";
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { arcTestnet, explorerTxUrl, OBSIDIAN_VAULT_ADDRESS } from "@/lib/arc-config";
import { OBSIDIAN_VAULT_ABI, TIMER_OPTIONS } from "@/lib/contract";
import {
  generateAgeIdentityPair,
  isValidAgeRecipient,
  type AgeIdentityPair,
  type EncryptedVaultFile
} from "@/lib/encryption";
import { estimateVaultGas } from "@/lib/gas-estimator";
import { uploadEncryptedFile, type IpfsUploadResult } from "@/lib/ipfs";
import { smartDeploy, type SmartDeployStatus } from "@/lib/smart-deploy";
import { FAUCET_URL } from "@/lib/app-kit-config";
import { AppHeader } from "./AppHeader";
import { DeployProgress } from "./DeployProgress";
import { FileEncryptor } from "./FileEncryptor";
import { Terminal } from "./Terminal";
import { useUSDCBalance } from "./USDCBalance";

type BeneficiaryInput = {
  id: string;
  address: string;
  recipient: string;
};

type DeployCheck = {
  id: string;
  label: string;
  done: boolean;
  hint: string;
};

export function CreateVaultClient() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const balance = useUSDCBalance(address);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryInput[]>([
    { id: "beneficiary-1", address: "", recipient: "" }
  ]);
  const [timerSeconds, setTimerSeconds] = useState<number>(TIMER_OPTIONS[0].seconds);
  const [generatedKey, setGeneratedKey] = useState<AgeIdentityPair | null>(null);
  const [encrypted, setEncrypted] = useState<EncryptedVaultFile | null>(null);
  const [ipfs, setIpfs] = useState<IpfsUploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verifyingIpfs, setVerifyingIpfs] = useState(false);
  const [txHash, setTxHash] = useState<Hash | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = useState("~$0.01 USDC");
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [hasSavedPrivateKey, setHasSavedPrivateKey] = useState(false);
  const [publicKeyApplied, setPublicKeyApplied] = useState(false);
  const [clipboardCountdown, setClipboardCountdown] = useState<number | null>(null);
  const [showDeployConfirm, setShowDeployConfirm] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const clipboardClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deployStatus, setDeployStatus] = useState<SmartDeployStatus>({
    stage: "idle",
    message: "Estimated cost: ~$0.01 USDC",
    progress: 0
  });

  const receipt = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: arcTestnet.id,
    confirmations: 1
  });

  const validBeneficiaries = useMemo(
    () =>
      beneficiaries
        .map((item) => ({
          address: sanitizeAddress(item.address),
          recipient: sanitizeAgeKey(item.recipient)
        }))
        .filter((item) => isAddress(item.address) && isValidAgeRecipient(item.recipient)),
    [beneficiaries]
  );

  const invalidAgeRecipient = useMemo(
    () => beneficiaries.find((item) => item.recipient.trim().length > 0 && !isValidAgeRecipient(item.recipient)),
    [beneficiaries]
  );

  const ageRecipients = useMemo(() => validBeneficiaries.map((item) => item.recipient), [validBeneficiaries]);
  const beneficiaryAddresses = useMemo(
    () => validBeneficiaries.map((item) => item.address as Address),
    [validBeneficiaries]
  );
  const createVaultArgs = useMemo(() => {
    if (!ipfs || !encrypted) return null;
    const sanitizedCid = sanitizeIPFS(ipfs.cid);
    if (!sanitizedCid) return null;

    return [
      `ipfs://${sanitizedCid}`,
      encrypted.encryptedKeyPartA,
      encrypted.encryptedKeyPartB,
      BigInt(timerSeconds),
      beneficiaryAddresses
    ] as const;
  }, [beneficiaryAddresses, encrypted, ipfs, timerSeconds]);
  const ageRecipientError = invalidAgeRecipient
    ? "Please enter a valid age public key starting with 'age1'."
    : null;
  const canEncrypt = ageRecipients.length > 0 && !ageRecipientError;
  const activeDeployStages = ["checking", "deploying"] as const;
  const isSmartDeployBusy = activeDeployStages.some((stage) => stage === deployStatus.stage);
  const balanceText = balance.isLoading
    ? "READING..."
    : balance.numericBalance === null
      ? "-- USDC"
      : `${balance.numericBalance.toFixed(2)} USDC`;
  const timerLabel = TIMER_OPTIONS.find((option) => option.seconds === timerSeconds)?.label ?? `${Math.round(timerSeconds / 86400)}D`;
  const deadlineText = useMemo(
    () => new Date(Date.now() + timerSeconds * 1000).toISOString().slice(0, 10),
    [timerSeconds]
  );
  const deployChecks = useMemo<DeployCheck[]>(() => {
    const checks: DeployCheck[] = [
      {
        id: "wallet",
        label: "Wallet connected",
        done: Boolean(isConnected && address),
        hint: "Use CONNECT WALLET in the header."
      },
      {
        id: "network",
        label: "Arc Testnet selected",
        done: chainId === arcTestnet.id,
        hint: "Switch your wallet to Arc Testnet."
      },
      {
        id: "balance",
        label: "USDC balance sufficient (> 0.01)",
        done: typeof balance.numericBalance === "number" && balance.numericBalance > 0.01,
        hint: "Get free testnet USDC from faucet.circle.com."
      },
      {
        id: "beneficiary",
        label: "At least one beneficiary added",
        done: beneficiaryAddresses.length > 0,
        hint: "Add a valid beneficiary address in Step 01."
      },
      {
        id: "agekey",
        label: "Valid age public key",
        done: ageRecipients.length > 0 && !ageRecipientError,
        hint: "Generate one above or paste a public key starting with age1."
      },
      {
        id: "file",
        label: "File encrypted and uploaded to IPFS",
        done: Boolean(ipfs && encrypted && createVaultArgs),
        hint: "Upload and encrypt a file in Step 02."
      }
    ];

    if (generatedKey) {
      checks.push({
        id: "private-key",
        label: "Private key saved",
        done: hasSavedPrivateKey,
        hint: "Check the private-key confirmation after saving it."
      });
    }

    return checks;
  }, [
    address,
    ageRecipientError,
    ageRecipients.length,
    balance.numericBalance,
    beneficiaryAddresses.length,
    chainId,
    createVaultArgs,
    encrypted,
    generatedKey,
    hasSavedPrivateKey,
    ipfs,
    isConnected
  ]);
  const deployReady = deployChecks.every((check) => check.done);

  async function generateIdentity() {
    setError(null);
    try {
      const pair = await generateAgeIdentityPair();
      setGeneratedKey(pair);
      setHasSavedPrivateKey(false);
      setPublicKeyApplied(false);
      setClipboardCountdown(null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to generate age identity.";
      setError(message);
    }
  }

  async function handleEncrypted(payload: EncryptedVaultFile) {
    setEncrypted(payload);
    setIpfs(null);
    setTxHash(undefined);
    setDeployStatus({
      stage: "idle",
      message: "Estimated cost: ~$0.01 USDC",
      progress: 0
    });
    setUploading(true);
    setError(null);
    try {
      const result = await uploadEncryptedFile(payload.encryptedFile);
      setIpfs(result);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "IPFS upload failed.";
      console.error("[obsidian] upload failed");
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  function requestDeployVault() {
    setError(null);

    if (!deployReady) {
      setError("Complete all READY TO DEPLOY checks first.");
      return;
    }

    setShowDeployConfirm(true);
  }

  async function confirmDeployVault() {
    setShowDeployConfirm(false);
    await deployVault();
  }

  async function deployVault() {
    setError(null);

    if (!isConnected || !address) {
      setError("Connect a wallet before deploying.");
      return;
    }

    if (!OBSIDIAN_VAULT_ADDRESS || !isAddress(OBSIDIAN_VAULT_ADDRESS)) {
      setError("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.");
      return;
    }

    if (!publicClient) {
      setError("Arc public client is not ready. Check NEXT_PUBLIC_ARC_RPC_URL and try again.");
      return;
    }

    if (!deployReady) {
      setError("Complete all READY TO DEPLOY checks first.");
      return;
    }

    if (chainId !== arcTestnet.id) {
      setDeployStatus({
        stage: "checking",
        message: "Switching wallet to Arc Testnet...",
        progress: 10
      });

      try {
        await switchChainAsync({ chainId: arcTestnet.id });
        await sleep(1000);
      } catch {
        const message = "Please switch to Arc Testnet first";
        setError(message);
        setDeployStatus({
          stage: "error",
          message,
          progress: 0,
          errorCode: "DEPLOY_FAILED"
        });
        return;
      }
    }

    if (!ipfs || !encrypted || !createVaultArgs) {
      setError("Encrypt and upload a file before deploying.");
      return;
    }

    if (ageRecipientError) {
      setError(ageRecipientError);
      return;
    }

    if (beneficiaryAddresses.length === 0) {
      setError("Add at least one valid beneficiary address and age public key starting with 'age1'.");
      return;
    }

    setVerifyingIpfs(true);
    const isAccessible = await verifyIPFS(ipfs.cid);
    setVerifyingIpfs(false);

    if (!isAccessible) {
      setError("File uploaded but not yet accessible on IPFS. Please wait 30 seconds and try again.");
      return;
    }

    const result = await smartDeploy({
      publicClient,
      writeContractAsync,
      address,
      vaultParams: {
        contractAddress: OBSIDIAN_VAULT_ADDRESS,
        abi: OBSIDIAN_VAULT_ABI,
        args: createVaultArgs
      },
      onStatus: setDeployStatus
    });

    if (result.success) {
      setTxHash(result.txHash);
    } else {
      setError(result.message);
    }
  }

  function updateBeneficiary(id: string, patch: Partial<BeneficiaryInput>) {
    setBeneficiaries((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeBeneficiary(id: string) {
    setBeneficiaries((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  }

  function addBeneficiary() {
    setBeneficiaries((current) => [
      ...current,
      { id: `beneficiary-${Date.now()}`, address: "", recipient: "" }
    ]);
  }

  async function copyGenerated(value: string, options: { clearAfterMs?: number } = {}) {
    await navigator.clipboard.writeText(value);
    if (options.clearAfterMs) {
      setClipboardCountdown(Math.round(options.clearAfterMs / 1000));

      if (clipboardClearTimer.current) {
        clearTimeout(clipboardClearTimer.current);
      }

      clipboardClearTimer.current = setTimeout(() => {
        navigator.clipboard.writeText("").catch(() => {});
        setClipboardCountdown(null);
      }, options.clearAfterMs);
    }
    console.log("[obsidian] copied");
  }

  async function applyGeneratedRecipient() {
    if (!generatedKey) return;

    await copyGenerated(generatedKey.recipient);
    setBeneficiaries((current) => {
      if (current.length === 0) {
        return [{ id: "beneficiary-1", address: "", recipient: generatedKey.recipient }];
      }

      return current.map((item, index) =>
        index === 0 ? { ...item, recipient: sanitizeAgeKey(generatedKey.recipient) } : item
      );
    });
    setPublicKeyApplied(true);
  }

  async function switchToArcFromBanner() {
    setError(null);
    try {
      await switchChainAsync({ chainId: arcTestnet.id });
    } catch {
      setError("Please switch to Arc Testnet first");
    }
  }

  useEffect(() => {
    if (receipt.isSuccess) {
      console.log("[obsidian] vault deployed");
      setDeployStatus({
        stage: "success",
        message: "Vault deployed and confirmed.",
        progress: 100,
        txHash
      });
    }
  }, [receipt.isSuccess, txHash]);

  useEffect(() => {
    if (clipboardCountdown === null || clipboardCountdown <= 0) return;

    const tick = setTimeout(() => {
      setClipboardCountdown((current) => (current && current > 1 ? current - 1 : null));
    }, 1000);

    return () => clearTimeout(tick);
  }, [clipboardCountdown]);

  useEffect(() => {
    const warningTimer = setTimeout(() => setShowSessionWarning(true), 10 * 60 * 1000);

    return () => {
      clearTimeout(warningTimer);
      if (clipboardClearTimer.current) {
        clearTimeout(clipboardClearTimer.current);
      }
      navigator.clipboard?.writeText("").catch(() => {});
      setGeneratedKey(null);
      setEncrypted(null);
      setIpfs(null);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshGasEstimate() {
      if (!address || !createVaultArgs || !OBSIDIAN_VAULT_ADDRESS || !isAddress(OBSIDIAN_VAULT_ADDRESS)) {
        setGasEstimate("~$0.01 USDC");
        setIsEstimatingGas(false);
        return;
      }

      setIsEstimatingGas(true);
      const estimate = await estimateVaultGas(
        publicClient,
        OBSIDIAN_VAULT_ADDRESS,
        OBSIDIAN_VAULT_ABI,
        "createVault",
        createVaultArgs,
        address
      );

      if (!cancelled) {
        setGasEstimate(estimate);
        setIsEstimatingGas(false);
      }
    }

    refreshGasEstimate();

    return () => {
      cancelled = true;
    };
  }, [address, createVaultArgs, publicClient]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-typeui-base px-4 py-6 text-typeui-text sm:px-6 lg:px-8">
      <AppHeader title="INITIALIZE VAULT" />
      <NetworkStatusBanner
        balanceText={balanceText}
        chainName={chain?.name}
        isConnected={isConnected}
        isLowOrMissingBalance={typeof balance.numericBalance !== "number" || balance.numericBalance <= 0.01}
        isOnArc={chainId === arcTestnet.id}
        onSwitch={switchToArcFromBanner}
      />

      {showSessionWarning ? (
        <div className="mb-5 border border-obsidian-warning/60 bg-typeui-night p-3 text-xs font-bold uppercase leading-5 text-obsidian-warning shadow-terminal">
          Your encryption session has been active for 10 minutes. Refresh if you suspect your device has been compromised.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-5">
          <Terminal title="STEP 01 / BENEFICIARIES">
            <div className="space-y-3">
              {beneficiaries.map((item, index) => (
                <div key={item.id} className="terminal-border grid gap-3 p-3 md:grid-cols-[1fr_1fr_auto]">
                  <label className="block min-w-0">
                    <span className="text-xs text-obsidian-dim">ADDRESS {index + 1}</span>
                    <input
                      value={item.address}
                      onChange={(event) => updateBeneficiary(item.id, { address: sanitizeAddress(event.target.value) })}
                      placeholder="0x..."
                      className="mt-1 min-h-11 w-full border border-obsidian-green/30 bg-obsidian-black px-3 text-sm text-obsidian-white outline-none focus:border-obsidian-green"
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className="text-xs text-obsidian-dim">AGE RECIPIENT</span>
                    <input
                      value={item.recipient}
                      onChange={(event) => {
                        setPublicKeyApplied(false);
                        updateBeneficiary(item.id, { recipient: sanitizeAgeKey(event.target.value) });
                      }}
                      placeholder="age1..."
                      className="mt-1 min-h-11 w-full border border-obsidian-green/30 bg-obsidian-black px-3 text-sm text-obsidian-white outline-none focus:border-obsidian-green"
                    />
                    <span className="mt-2 block text-xs leading-5 text-obsidian-dim">
                      Paste the public key that starts with &quot;age1&quot;. This is NOT your private key.
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeBeneficiary(item.id)}
                    className="terminal-border inline-flex min-h-11 items-center justify-center px-3 text-obsidian-warning hover:bg-obsidian-warning hover:text-obsidian-black"
                    title="Remove beneficiary"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addBeneficiary}
                  className="terminal-border inline-flex min-h-10 items-center gap-2 px-3 text-sm text-obsidian-green hover:bg-obsidian-green hover:text-obsidian-black"
                  title="Add beneficiary"
                >
                  <Plus size={16} />
                  ADD
                </button>
                <button
                  type="button"
                  onClick={generateIdentity}
                  className="terminal-border inline-flex min-h-10 items-center gap-2 px-3 text-sm text-obsidian-white hover:bg-obsidian-white hover:text-obsidian-black"
                  title="Generate age identity"
                >
                  <KeyRound size={16} />
                  GENERATE AGE KEY
                </button>
              </div>
              {generatedKey ? (
                <div className="space-y-3 text-xs">
                  <div className="border border-red-700 bg-typeui-night p-3 text-typeui-cream">
                    <div className="mb-2 flex items-center gap-2 font-bold uppercase text-red-600">
                      <ShieldAlert size={16} aria-hidden="true" />
                      Critical - save this private key now
                    </div>
                    <p className="mb-3 leading-5 text-typeui-cream">
                      This key will not be shown again. Without it you cannot decrypt documents after trigger. Never share it.
                    </p>
                    <textarea
                      value={generatedKey.identity}
                      readOnly
                      rows={3}
                      className="w-full resize-y border border-red-700 bg-obsidian-black p-2 text-xs text-obsidian-white outline-none"
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => copyGenerated(generatedKey.identity, { clearAfterMs: 30000 })}
                        className="terminal-border inline-flex min-h-9 items-center gap-2 px-3 font-bold uppercase text-obsidian-warning hover:bg-obsidian-warning hover:text-obsidian-black"
                        title="Copy private key"
                      >
                        <Copy size={14} aria-hidden="true" />
                        COPY PRIVATE KEY
                      </button>
                      {clipboardCountdown !== null ? (
                        <span className="font-bold uppercase text-red-600">Clipboard clears in {clipboardCountdown}s</span>
                      ) : null}
                    </div>
                    <label className="mt-3 flex items-start gap-2 font-bold uppercase text-red-600">
                      <input
                        type="checkbox"
                        checked={hasSavedPrivateKey}
                        onChange={(event) => setHasSavedPrivateKey(event.target.checked)}
                        className="mt-1"
                      />
                      I have saved my private key
                    </label>
                  </div>

                  <div className="terminal-border bg-typeui-night p-3 text-typeui-cream">
                    <div className="mb-2 flex items-center gap-2 font-bold uppercase text-obsidian-green">
                      <Copy size={15} aria-hidden="true" />
                      Public key - paste as recipient
                    </div>
                    <textarea
                      value={generatedKey.recipient}
                      readOnly
                      rows={2}
                      className="w-full resize-y border border-obsidian-green/30 bg-obsidian-black p-2 text-xs text-obsidian-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={applyGeneratedRecipient}
                      className="mt-3 terminal-border inline-flex min-h-9 items-center gap-2 px-3 font-bold uppercase text-obsidian-green hover:bg-obsidian-green hover:text-obsidian-black"
                      title="Copy and use public key as age recipient"
                    >
                      <Copy size={14} aria-hidden="true" />
                      COPY & USE AS RECIPIENT
                    </button>
                    {publicKeyApplied ? (
                      <p className="mt-2 font-bold uppercase text-obsidian-green">Public key applied</p>
                    ) : null}
                    <p className="mt-2 leading-5 text-obsidian-dim">This is what goes in AGE RECIPIENT.</p>
                  </div>
                </div>
              ) : null}
              {ageRecipientError ? <p className="break-words text-xs text-obsidian-warning">{ageRecipientError}</p> : null}
              <div className="terminal-border cursor-not-allowed space-y-2 p-3 text-xs opacity-50">
                <div className="flex flex-wrap items-center gap-2 font-bold uppercase text-obsidian-white">
                  <Gift size={15} aria-hidden="true" />
                  NGO SPONSORSHIP CODE
                  <span className="border border-obsidian-green/40 px-2 py-1 text-[10px] text-obsidian-green">COMING SOON</span>
                </div>
                <p className="leading-5 text-obsidian-dim">Contact security@obsidian-protocol.xyz for organizational access.</p>
              </div>
            </div>
          </Terminal>

          <Terminal title="STEP 02 / ENCRYPT + UPLOAD">
            <FileEncryptor recipients={ageRecipients} disabled={!canEncrypt || uploading} onEncrypted={handleEncrypted} />
            {uploading ? <p className="mt-3 text-xs text-obsidian-white">UPLOADING ENCRYPTED PAYLOAD TO IPFS...</p> : null}
            {ipfs ? (
              <div className="mt-4 terminal-border p-3 text-xs">
                <div className="text-obsidian-dim">IPFS HASH</div>
                <a className="break-all text-obsidian-white hover:text-obsidian-green" href={ipfs.gatewayUrl} target="_blank" rel="noreferrer">
                  {ipfs.ipfsUri}
                </a>
              </div>
            ) : null}
          </Terminal>
        </div>

        <div className="space-y-5">
          <Terminal title="STEP 03 / TIMER">
            <div className="grid grid-cols-3 gap-2">
              {TIMER_OPTIONS.map((option) => (
                <button
                  key={option.seconds}
                  type="button"
                  onClick={() => setTimerSeconds(option.seconds)}
                  className={`terminal-border min-h-14 px-3 font-bold ${
                    timerSeconds === option.seconds
                      ? "bg-obsidian-green text-obsidian-black"
                      : "text-obsidian-green hover:bg-obsidian-green hover:text-obsidian-black"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Terminal>

          <Terminal title="STEP 04 / DEPLOY">
            <div className="space-y-4 text-sm">
              <SummaryRow label="WALLET" value={address || "DISCONNECTED"} />
              <SummaryRow label="BENEFICIARIES" value={String(beneficiaryAddresses.length)} />
              <SummaryRow label="ENCRYPTED FILE" value={encrypted ? encrypted.envelope.originalName : "NONE"} />
              <SummaryRow label="IPFS" value={ipfs?.ipfsUri || "PENDING"} />
              <SummaryRow label="ARC BALANCE" value={balanceText} />
              <SummaryRow label="GAS ESTIMATE" value={isEstimatingGas ? "ESTIMATING..." : gasEstimate} />
              <SummaryRow label="SPONSOR" value="COMING SOON" />
              <DeployChecklist checks={deployChecks} />
              <DeployProgress status={deployStatus} txHash={txHash} onRetry={requestDeployVault} />
              <button
                type="button"
                onClick={requestDeployVault}
                disabled={isSmartDeployBusy || uploading || verifyingIpfs || !deployReady}
                className="terminal-border inline-flex min-h-12 w-full items-center justify-center gap-2 bg-obsidian-green px-4 font-bold text-obsidian-black hover:bg-obsidian-white disabled:cursor-not-allowed disabled:opacity-50"
                title="Smart deploy vault"
              >
                {isSmartDeployBusy || verifyingIpfs ? <Loader2 className="animate-spin" size={18} /> : null}
                {verifyingIpfs
                  ? "VERIFYING IPFS..."
                  : isSmartDeployBusy
                    ? deployStatus.stage === "checking"
                      ? "CHECKING BALANCE..."
                      : "SIGN DEPLOY..."
                    : "DEPLOY VAULT"}
              </button>
              {txHash ? (
                <div className="terminal-border p-3 text-xs">
                  <div className="text-obsidian-dim">TX HASH</div>
                  <a className="break-all text-obsidian-white hover:text-obsidian-green" href={explorerTxUrl(txHash)} target="_blank" rel="noreferrer">
                    {txHash}
                  </a>
                </div>
              ) : null}
              {receipt.isSuccess && address ? (
                <Link
                  href={`/vault/${address}`}
                  className="terminal-border inline-flex min-h-11 w-full items-center justify-center text-sm font-bold text-obsidian-white hover:bg-obsidian-white hover:text-obsidian-black"
                >
                  OPEN DASHBOARD
                </Link>
              ) : null}
              {error ? <p className="break-words text-xs text-obsidian-warning">{error}</p> : null}
            </div>
          </Terminal>
        </div>
      </div>
      {showDeployConfirm && encrypted && ipfs ? (
        <ConfirmDeployModal
          beneficiaryCount={beneficiaryAddresses.length}
          deadlineText={deadlineText}
          fileName={encrypted.envelope.originalName}
          gasEstimate={gasEstimate}
          ipfsHash={`ipfs://${sanitizeIPFS(ipfs.cid)}`}
          onCancel={() => setShowDeployConfirm(false)}
          onConfirm={confirmDeployVault}
          timerLabel={timerLabel}
        />
      ) : null}
    </main>
  );
}

async function verifyIPFS(cid: string): Promise<boolean> {
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000)
    });

    return response.ok;
  } catch {
    return false;
  }
}

function NetworkStatusBanner({
  balanceText,
  chainName,
  isConnected,
  isLowOrMissingBalance,
  isOnArc,
  onSwitch
}: {
  balanceText: string;
  chainName?: string;
  isConnected: boolean;
  isLowOrMissingBalance: boolean;
  isOnArc: boolean;
  onSwitch: () => void;
}) {
  if (!isConnected) {
    return (
      <div className="mb-5 border border-obsidian-warning/60 bg-typeui-night p-4 text-typeui-cream shadow-terminal">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase text-obsidian-warning">
              <AlertTriangle size={17} aria-hidden="true" />
              Connect your wallet to continue
            </div>
            <p className="mt-1 text-xs uppercase text-obsidian-dim">Vault deployment requires an Arc Testnet wallet.</p>
          </div>
          <ConnectButton.Custom>
            {({ mounted, openConnectModal }) => (
              <button
                type="button"
                disabled={!mounted}
                onClick={openConnectModal}
                className="terminal-border inline-flex min-h-10 items-center justify-center px-3 text-xs font-bold uppercase text-obsidian-green hover:bg-obsidian-green hover:text-obsidian-black disabled:opacity-50"
              >
                CONNECT WALLET
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </div>
    );
  }

  if (!isOnArc) {
    return (
      <div className="mb-5 border border-obsidian-warning/60 bg-typeui-night p-4 text-typeui-cream shadow-terminal">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase text-obsidian-warning">
              <AlertTriangle size={17} aria-hidden="true" />
              Wrong network
            </div>
            <p className="mt-1 text-xs uppercase text-obsidian-dim">
              You are on {chainName ?? "another network"}. Switch to Arc Testnet.
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitch}
            className="terminal-border inline-flex min-h-10 items-center justify-center px-3 text-xs font-bold uppercase text-obsidian-green hover:bg-obsidian-green hover:text-obsidian-black"
          >
            SWITCH TO ARC TESTNET
          </button>
        </div>
      </div>
    );
  }

  if (isLowOrMissingBalance) {
    return (
      <div className="mb-5 border border-obsidian-warning/60 bg-typeui-night p-4 text-typeui-cream shadow-terminal">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase text-obsidian-warning">
              <AlertTriangle size={17} aria-hidden="true" />
              No USDC - get free testnet USDC
            </div>
            <p className="mt-1 text-xs uppercase text-obsidian-dim">You need about $0.01 USDC for gas.</p>
          </div>
          <a
            href={FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="terminal-border inline-flex min-h-10 items-center justify-center gap-2 px-3 text-xs font-bold uppercase text-obsidian-green hover:bg-obsidian-green hover:text-obsidian-black"
          >
            faucet.circle.com
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 border border-obsidian-green/60 bg-typeui-night p-4 text-typeui-cream shadow-terminal">
      <div className="flex items-center gap-2 text-sm font-bold uppercase text-obsidian-green">
        <Check size={17} aria-hidden="true" />
        Ready - Arc Testnet / {balanceText}
      </div>
    </div>
  );
}

function DeployChecklist({ checks }: { checks: DeployCheck[] }) {
  return (
    <div className="terminal-border space-y-3 p-3 text-xs">
      <div className="font-bold uppercase text-obsidian-white">Ready to deploy</div>
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.id} className="grid gap-1">
            <div className={`flex items-center gap-2 font-bold uppercase ${check.done ? "text-obsidian-green" : "text-obsidian-warning"}`}>
              {check.done ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
              {check.label}
            </div>
            {!check.done ? (
              <div className="pl-6 leading-5 text-obsidian-dim">
                {check.hint}
                {check.id === "balance" ? (
                  <a
                    href={FAUCET_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 inline-flex items-center gap-1 font-bold uppercase text-obsidian-green hover:text-obsidian-white"
                  >
                    Faucet
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmDeployModal({
  beneficiaryCount,
  deadlineText,
  fileName,
  gasEstimate,
  ipfsHash,
  onCancel,
  onConfirm,
  timerLabel
}: {
  beneficiaryCount: number;
  deadlineText: string;
  fileName: string;
  gasEstimate: string;
  ipfsHash: string;
  onCancel: () => void;
  onConfirm: () => void;
  timerLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-black/80 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl border border-obsidian-warning bg-typeui-base p-5 text-sm text-typeui-text shadow-poster">
        <div className="mb-4 flex items-center gap-2 text-lg font-bold uppercase text-obsidian-warning">
          <ShieldAlert size={20} aria-hidden="true" />
          Confirm vault deployment
        </div>
        <p className="mb-4 font-bold uppercase text-obsidian-warning">This action is irreversible.</p>
        <div className="grid gap-2 text-xs sm:grid-cols-[8rem_1fr]">
          <span className="text-typeui-muted">FILE</span>
          <span className="break-words font-bold">{fileName}</span>
          <span className="text-typeui-muted">IPFS</span>
          <span className="break-all font-bold">{ipfsHash}</span>
          <span className="text-typeui-muted">TIMER</span>
          <span className="font-bold">{timerLabel}</span>
          <span className="text-typeui-muted">DEADLINE</span>
          <span className="font-bold">{deadlineText}</span>
          <span className="text-typeui-muted">BENEFICIARIES</span>
          <span className="font-bold">{beneficiaryCount}</span>
          <span className="text-typeui-muted">GAS</span>
          <span className="font-bold">{gasEstimate}</span>
        </div>
        <div className="mt-4 border border-obsidian-warning/60 p-3 text-xs font-bold uppercase leading-5 text-obsidian-warning">
          Once deployed: cannot be cancelled, cannot be modified, and will trigger if you miss the deadline.
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="terminal-border min-h-11 px-4 font-bold uppercase text-typeui-text hover:bg-typeui-night hover:text-typeui-cream"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="terminal-border min-h-11 bg-obsidian-warning px-4 font-bold uppercase text-obsidian-black hover:bg-obsidian-green"
          >
            CONFIRM & DEPLOY
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3">
      <span className="text-obsidian-dim">{label}</span>
      <span className="min-w-0 break-words text-obsidian-white">{value}</span>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function sanitizeAddress(input: string): string {
  return input.trim().toLowerCase();
}

function sanitizeAgeKey(input: string): string {
  return input.trim().replace(/\s+/g, "");
}

function sanitizeIPFS(input: string): string {
  const value = input.startsWith("ipfs://") ? input.slice("ipfs://".length) : input;
  return value.trim().replace(/[^a-zA-Z0-9]/g, "");
}
