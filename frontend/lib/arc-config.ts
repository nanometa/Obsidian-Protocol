import type { Address } from "viem";

const FALLBACK_ARC_TESTNET = {
  chainId: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  rpcEndpoints: ["https://rpc.testnet.arc.network/"],
  explorerUrl: "https://testnet.arcscan.app/tx/{hash}",
  usdcAddress: "0x3600000000000000000000000000000000000000"
} as const;

const officialArcTestnet = loadOfficialArcTestnet() as {
  id?: number;
  chainId?: number;
  name?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls?: {
    default?: {
      http?: string[];
    };
  };
  rpcEndpoints?: string[];
  explorerUrl?: string;
};

function loadOfficialArcTestnet() {
  try {
    if (typeof window !== "undefined") {
      return FALLBACK_ARC_TESTNET;
    }

    const nodeRequire = eval("require") as (id: string) => { ArcTestnet?: unknown };
    const arcModule = nodeRequire("@circle-fin/app-kit/chains");
    return arcModule.ArcTestnet ?? FALLBACK_ARC_TESTNET;
  } catch {
    return FALLBACK_ARC_TESTNET;
  }
}

const ARC_RPC = (() => {
  try {
    return (
      officialArcTestnet.rpcUrls?.default?.http?.[0] ??
      officialArcTestnet.rpcEndpoints?.[0]?.replace(/\/$/, "") ??
      "https://rpc.testnet.arc.network"
    );
  } catch {
    return "https://rpc.testnet.arc.network";
  }
})();

const configuredArcRpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || ARC_RPC;
const configuredContractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const officialChainId = officialArcTestnet.chainId ?? officialArcTestnet.id ?? 5042002;
const configuredChainId = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? String(officialChainId), 10);
const explorerBaseUrl = (process.env.NEXT_PUBLIC_EXPLORER_URL || officialArcTestnet.explorerUrl || "https://testnet.arcscan.app").replace(
  /\/tx\/\{hash\}$/,
  ""
);

if (!configuredContractAddress) {
  throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set in .env");
}

export const ARC_TESTNET = {
  id: Number.isFinite(configuredChainId) ? configuredChainId : 5042002,
  name: officialArcTestnet.name ?? "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: officialArcTestnet.nativeCurrency ?? {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [configuredArcRpcUrl]
    },
    public: {
      http: [configuredArcRpcUrl]
    }
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: explorerBaseUrl
    }
  },
  testnet: true
} as const;

export const arcTestnet = ARC_TESTNET;
export const ARC_CHAIN_ID = ARC_TESTNET.id;
export const ARC_RPC_URL = ARC_TESTNET.rpcUrls.default.http[0];
export const ARC_EXPLORER_URL = ARC_TESTNET.blockExplorers.default.url;
export const EVENT_START_BLOCK = BigInt(process.env.NEXT_PUBLIC_EVENT_START_BLOCK || "46313342");
export const CONTRACT_ADDRESS = configuredContractAddress as Address;

export const OBSIDIAN_VAULT_ADDRESS = CONTRACT_ADDRESS;

export function explorerTxUrl(hash: string) {
  return `${ARC_EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddressUrl(address: string) {
  return `${ARC_EXPLORER_URL}/address/${address}`;
}
