export const SUPPORTED_SOURCE_CHAINS = [
  { id: "Base_Sepolia", label: "Base Sepolia" },
  { id: "Ethereum_Sepolia", label: "Ethereum Sepolia" },
  { id: "Arbitrum_Sepolia", label: "Arbitrum Sepolia" }
] as const;

export type SupportedSourceChainId = (typeof SUPPORTED_SOURCE_CHAINS)[number]["id"];

export const MAX_BRIDGE_AMOUNT = "5.00";
export const MIN_BRIDGE_AMOUNT = "0.10";
export const FAUCET_URL = "https://faucet.circle.com";
