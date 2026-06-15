import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { TerminalAnimation } from "./TerminalAnimation";

export function HeroSection() {
  return (
    <section className="relative min-h-[92svh] overflow-hidden bg-typeui-night text-typeui-cream">
      <div className="absolute inset-y-0 right-0 hidden w-[40%] bg-typeui-secondary lg:block" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[92svh] w-full max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)] lg:px-8">
        <div data-reveal className="max-w-4xl">
          <p className="inline-flex border border-typeui-primary bg-typeui-ember px-3 py-2 text-xs font-semibold uppercase text-typeui-primary">
            Arc Testnet / Dead Man&apos;s Switch
          </p>
          <h1 className="mt-8 max-w-4xl text-5xl font-bold leading-none text-typeui-cream sm:text-6xl lg:text-7xl xl:text-8xl">
            Your truth
            <br />
            survives you.
          </h1>
          <p className="mt-6 max-w-2xl text-xl font-medium leading-8 text-typeui-cream sm:text-2xl">
            A cryptographic dead man&apos;s switch for journalists, whistleblowers, and political dissidents.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/vault/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-typeui-primary bg-typeui-primary px-5 py-3 text-sm font-bold uppercase text-typeui-night transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-typeui-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-cream focus-visible:ring-offset-2 focus-visible:ring-offset-typeui-night"
            >
              <ShieldCheck size={18} aria-hidden="true" />
              [INITIALIZE VAULT]
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              href="/verify"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-typeui-cream bg-transparent px-5 py-3 text-sm font-bold uppercase text-typeui-cream transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-typeui-cream hover:text-typeui-night focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-primary focus-visible:ring-offset-2 focus-visible:ring-offset-typeui-night"
            >
              <Search size={18} aria-hidden="true" />
              [VERIFY A VAULT]
            </Link>
            <Link
              href="/docs"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-typeui-primary bg-transparent px-5 py-3 text-sm font-bold uppercase text-typeui-primary transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-typeui-primary hover:text-typeui-night focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-primary focus-visible:ring-offset-2 focus-visible:ring-offset-typeui-night"
            >
              [DOCUMENTATION]
            </Link>
          </div>
          <p className="mt-8 max-w-xl text-xs font-medium leading-5 text-typeui-primary">
            <span className="block">No accounts. No KYC. No servers.</span>
            <span className="block">Deployed on Arc blockchain. Code is law.</span>
          </p>
        </div>

        <div data-reveal className="hidden md:block">
          <TerminalAnimation />
        </div>
      </div>
    </section>
  );
}
