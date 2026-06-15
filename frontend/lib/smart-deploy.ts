"use client";

import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { erc20Abi, formatEther, formatUnits, isAddress } from "viem";
import type { Address, Hash, PublicClient } from "viem";
import { ARC_CHAIN_ID, ARC_RPC_URL, OBSIDIAN_VAULT_ADDRESS } from "@/lib/arc-config";
import { OBSIDIAN_VAULT_ABI } from "@/lib/contract";

const ARC_USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const MINIMUM_ARC_USDC = 0.001;

export type VaultParams = {
  args: readonly [string, string, string, bigint, readonly Address[]];
  contractAddress?: Address;
  abi?: typeof OBSIDIAN_VAULT_ABI;
};

export type SmartDeployStage = "idle" | "checking" | "deploying" | "success" | "error";

export type SmartDeployErrorCode = "NO_USDC" | "DEPLOY_FAILED";

export type SmartDeployStatus = {
  stage: SmartDeployStage;
  message: string;
  progress: number;
  txHash?: Hash;
  errorCode?: SmartDeployErrorCode;
};

export type SmartDeployResult =
  | {
      success: true;
      txHash: Hash;
    }
  | {
      success: false;
      error: SmartDeployErrorCode;
      message: string;
    };

type WriteCreateVaultAsync = (parameters: {
  address: Address;
  abi: typeof OBSIDIAN_VAULT_ABI;
  functionName: "createVault";
  args: VaultParams["args"];
  chainId: number;
}) => Promise<Hash>;

export type SmartDeployParams = {
  publicClient: PublicClient;
  writeContractAsync: WriteCreateVaultAsync;
  address: Address;
  vaultParams: VaultParams;
  onStatus: (status: SmartDeployStatus) => void;
};

export async function smartDeploy({
  publicClient,
  writeContractAsync,
  address,
  vaultParams,
  onStatus
}: SmartDeployParams): Promise<SmartDeployResult> {
  onStatus({
    stage: "checking",
    message: "Checking Arc USDC balance...",
    progress: 25
  });

  const arcBalance = await getArcUSDCBalance(publicClient, address);

  if (arcBalance < MINIMUM_ARC_USDC) {
    const message = "You need USDC on Arc Testnet. Get free testnet USDC at faucet.circle.com then try again.";
    onStatus({
      stage: "error",
      message,
      progress: 0,
      errorCode: "NO_USDC"
    });

    return {
      success: false,
      error: "NO_USDC",
      message
    };
  }

  onStatus({
    stage: "deploying",
    message: "Deploying vault to Arc...",
    progress: 75
  });

  try {
    const txHash = await deployWithArcAdapter(vaultParams).catch(async (adapterError) => {
      console.warn("[arc-adapter] fallback to wagmi:", adapterError);
      return writeContractAsync({
        address: vaultParams.contractAddress ?? OBSIDIAN_VAULT_ADDRESS,
        abi: vaultParams.abi ?? OBSIDIAN_VAULT_ABI,
        functionName: "createVault",
        args: vaultParams.args,
        chainId: ARC_CHAIN_ID
      });
    });

    onStatus({
      stage: "success",
      message: "Vault deployed successfully.",
      progress: 100,
      txHash
    });

    return {
      success: true,
      txHash
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Deploy failed.";
    onStatus({
      stage: "error",
      message,
      progress: 0,
      errorCode: "DEPLOY_FAILED"
    });

    return {
      success: false,
      error: "DEPLOY_FAILED",
      message
    };
  }
}

async function deployWithArcAdapter(vaultParams: VaultParams): Promise<Hash> {
  const ethereum = typeof window !== "undefined" ? (window as Window & { ethereum?: unknown }).ethereum : undefined;

  if (!ethereum) {
    throw new Error("No wallet found");
  }

  const adapter = await createViemAdapterFromProvider({
    provider: ethereum as never
  });

  const hash = await (adapter as any).walletClient.writeContract({
    address: vaultParams.contractAddress ?? OBSIDIAN_VAULT_ADDRESS,
    abi: vaultParams.abi ?? OBSIDIAN_VAULT_ABI,
    functionName: "createVault",
    args: vaultParams.args,
    chain: {
      id: ARC_CHAIN_ID,
      name: "Arc Testnet",
      nativeCurrency: {
        name: "USDC",
        symbol: "USDC",
        decimals: 18
      },
      rpcUrls: {
        default: {
          http: [ARC_RPC_URL]
        }
      }
    }
  });

  return hash as Hash;
}

export async function getArcUSDCBalance(publicClient: PublicClient, address: Address): Promise<number> {
  if (ARC_USDC_ADDRESS && isAddress(ARC_USDC_ADDRESS)) {
    try {
      const balance = await publicClient.readContract({
        address: ARC_USDC_ADDRESS as Address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address]
      });

      return Number(formatUnits(balance, 6));
    } catch {
      // Arc uses USDC as the native gas token, so fall back to native balance.
    }
  }

  try {
    const nativeBalance = await publicClient.getBalance({ address });
    return Number(formatEther(nativeBalance));
  } catch {
    return 0;
  }
}
