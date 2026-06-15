"use client";

import { connectorsForWallets, midnightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { ARC_RPC_URL, ARC_TESTNET } from "@/lib/arc-config";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [injectedWallet]
    }
  ],
  {
    appName: "Obsidian Protocol",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ""
  }
);

const wagmiConfig = createConfig({
  chains: [ARC_TESTNET],
  connectors,
  ssr: true,
  transports: {
    [ARC_TESTNET.id]: http(ARC_RPC_URL)
  }
});

const baseRainbowTheme = midnightTheme({
  accentColor: "#6EACDA",
  accentColorForeground: "#021526",
  borderRadius: "none",
  fontStack: "system"
});

const rainbowTheme = {
  ...baseRainbowTheme,
  colors: {
    ...baseRainbowTheme.colors,
    accentColor: "#6EACDA",
    accentColorForeground: "#021526",
    actionButtonBorder: "#6EACDA",
    actionButtonBorderMobile: "#6EACDA",
    actionButtonSecondaryBackground: "#03346E",
    closeButton: "#DDF2FD",
    closeButtonBackground: "#021526",
    connectButtonBackground: "#6EACDA",
    connectButtonBackgroundError: "#03346E",
    connectButtonInnerBackground: "#DDF2FD",
    connectButtonText: "#021526",
    connectButtonTextError: "#DDF2FD",
    downloadBottomCardBackground: "#021526",
    downloadTopCardBackground: "#03346E",
    error: "#03346E",
    generalBorder: "#6EACDA",
    generalBorderDim: "rgba(3, 52, 110, 0.35)",
    menuItemBackground: "rgba(110, 172, 218, 0.22)",
    modalBackdrop: "rgba(2, 21, 38, 0.74)",
    modalBackground: "#DDF2FD",
    modalBorder: "#6EACDA",
    modalText: "#021526",
    modalTextDim: "#03346E",
    modalTextSecondary: "#03346E",
    profileAction: "#03346E",
    profileActionHover: "#6EACDA",
    profileForeground: "#DDF2FD",
    selectedOptionBorder: "#6EACDA",
    standby: "#03346E"
  },
  shadows: {
    ...baseRainbowTheme.shadows,
    dialog: "0 22px 80px rgba(2, 21, 38, 0.34)",
    walletLogo: "0 4px 16px rgba(2, 21, 38, 0.2)"
  }
};

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={ARC_TESTNET.id}
          modalSize="compact"
          theme={rainbowTheme}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
