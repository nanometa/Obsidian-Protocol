import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { USDCBalance } from "./USDCBalance";
import { WalletConnect } from "./WalletConnect";

type AppHeaderProps = {
  title: string;
  showWallet?: boolean;
};

export function AppHeader({ title, showWallet = true }: AppHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-2" aria-label="Primary">
          <Link
            href="/"
            className="inline-flex min-h-11 w-fit items-center gap-2 border border-typeui-secondary bg-typeui-night px-4 text-sm font-bold uppercase text-typeui-cream transition-all duration-200 ease-out hover:-translate-x-0.5 hover:border-typeui-primary hover:text-typeui-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-primary"
            title="Back to landing page"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            LANDING
          </Link>
          <Link
            href="/docs"
            className="inline-flex min-h-11 w-fit items-center border border-typeui-secondary bg-typeui-night px-4 text-sm font-bold uppercase text-typeui-cream transition-all duration-200 ease-out hover:border-typeui-primary hover:text-typeui-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-primary"
            title="Open documentation"
          >
            DOCS
          </Link>
        </nav>
        {showWallet ? (
          <div className="flex flex-wrap items-start gap-2 sm:justify-end">
            <USDCBalance />
            <WalletConnect />
          </div>
        ) : null}
      </div>
      <h1 className="break-words text-3xl font-bold uppercase text-typeui-secondary sm:text-4xl">{title}</h1>
    </header>
  );
}
