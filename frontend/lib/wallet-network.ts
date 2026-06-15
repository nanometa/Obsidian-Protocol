import { ARC_TESTNET } from "@/lib/arc-config";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type WalletSwitchChain = (variables: { chainId: number }) => Promise<unknown>;

const ARC_CHAIN_ID_HEX = `0x${ARC_TESTNET.id.toString(16)}`;

function getEthereumProvider() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as Window & { ethereum?: EthereumProvider }).ethereum;
}

export function getWalletErrorCode(error: unknown): number | undefined {
  let current: unknown = error;

  while (current && typeof current === "object") {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "number") {
      return code;
    }
    if (typeof code === "string" && /^\d+$/.test(code)) {
      return Number(code);
    }
    current = (current as { cause?: unknown }).cause;
  }

  return undefined;
}

export async function addArcNetwork() {
  const ethereum = getEthereumProvider();
  if (!ethereum) {
    return;
  }

  try {
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: ARC_CHAIN_ID_HEX,
          chainName: ARC_TESTNET.name,
          nativeCurrency: ARC_TESTNET.nativeCurrency,
          rpcUrls: ARC_TESTNET.rpcUrls.default.http,
          blockExplorerUrls: [ARC_TESTNET.blockExplorers.default.url]
        }
      ]
    });
  } catch (error) {
    console.error("[obsidian] wallet network add failed");
    throw error;
  }
}

export async function switchToArcTestnet(switchChain: WalletSwitchChain) {
  await addArcNetwork();

  try {
    await switchChain({ chainId: ARC_TESTNET.id });
    await waitForWalletChain(ARC_CHAIN_ID_HEX);
  } catch (error) {
    if (getWalletErrorCode(error) === 4902) {
      await addArcNetwork();
      await switchChain({ chainId: ARC_TESTNET.id });
      await waitForWalletChain(ARC_CHAIN_ID_HEX);
      return;
    }

    throw error;
  }
}

async function waitForWalletChain(expectedChainIdHex: string) {
  const ethereum = getEthereumProvider();
  if (!ethereum) return;

  const expected = expectedChainIdHex.toLowerCase();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const current = await ethereum.request({ method: "eth_chainId" });
    if (typeof current === "string" && current.toLowerCase() === expected) {
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
}
