import type { Metadata } from "next";
import { Chakra_Petch, JetBrains_Mono } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "../styles/globals.css";
import { Providers } from "./providers";

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-chakra"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains"
});

export const metadata: Metadata = {
  title: "OBSIDIAN PROTOCOL",
  description: "Dead man's switch vaults for encrypted public-interest disclosures."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${chakraPetch.variable} ${jetBrainsMono.variable} bg-typeui-base`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
