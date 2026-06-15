import { ExternalLink } from "lucide-react";
import Link from "next/link";

type SetupStep = {
  title: string;
  body: string;
  href?: string;
  label?: string;
  internal?: boolean;
  details?: readonly string[];
};

const steps: readonly SetupStep[] = [
  {
    title: "Step 1 - Get a Wallet",
    body: "Install MetaMask from metamask.io. Create a new wallet dedicated to Obsidian. Never reuse a wallet linked to your identity.",
    href: "https://metamask.io",
    label: "MetaMask"
  },
  {
    title: "Step 2 - Add Arc Testnet",
    body: "Click ADD ARC NETWORK in the app header. MetaMask will ask for confirmation. Accept.",
    details: ["RPC: https://rpc.testnet.arc.network", "Chain ID: 5042002", "Symbol: USDC"]
  },
  {
    title: "Step 3 - Get Testnet USDC",
    body: "Go to the Circle faucet and request testnet USDC for your wallet address.",
    href: "https://faucet.circle.com",
    label: "Circle faucet"
  },
  {
    title: "Step 4 - Create Your Vault",
    body: "Go to /vault/new. Upload your document. Set your timer. Deploy.",
    href: "/vault/new",
    label: "Initialize vault",
    internal: true
  },
  {
    title: "Step 5 - Send Heartbeats",
    body: "Visit your vault dashboard regularly. Send a heartbeat before the timer expires. Set a personal reminder 48 hours before deadline.",
    href: "/vault/[address]",
    label: "Vault dashboard pattern",
    internal: true
  }
] as const;

export function SetupGuide() {
  return (
    <ol className="grid gap-3 md:grid-cols-2">
      {steps.map((step) => {
        const isRoutePattern = step.href?.includes("[");

        return (
          <li key={step.title} className="border border-typeui-primary/35 bg-typeui-secondary/30 p-4">
            <h3 className="text-sm font-bold uppercase text-typeui-primary">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-typeui-cream">{step.body}</p>
            {step.details ? (
              <ul className="mt-3 space-y-1 font-mono text-xs leading-5 text-typeui-warning">
                {step.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
            {step.href ? (
              step.internal && !isRoutePattern ? (
                <Link
                  href={step.href}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 border border-typeui-primary px-3 text-xs font-bold uppercase text-typeui-primary hover:bg-typeui-primary hover:text-typeui-night focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-primary"
                >
                  {step.label}
                  <ExternalLink size={14} aria-hidden="true" />
                </Link>
              ) : (
                <a
                  href={step.href}
                  target={step.internal ? undefined : "_blank"}
                  rel={step.internal ? undefined : "noreferrer"}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 border border-typeui-primary px-3 text-xs font-bold uppercase text-typeui-primary hover:bg-typeui-primary hover:text-typeui-night focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-primary"
                >
                  {step.label}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              )
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
