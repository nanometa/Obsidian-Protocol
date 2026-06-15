import type { LucideIcon } from "lucide-react";
import { BadgeDollarSign, Blocks, FastForward, LockKeyhole } from "lucide-react";

const arcReasons: Array<{ title: string; text: string; badge?: string; Icon: LucideIcon }> = [
  {
    title: "Sub-Second Finality",
    text: "Recorded forever in under one second. No reorganization. No rollback.",
    Icon: FastForward
  },
  {
    title: "USDC Gas",
    text: "No ETH needed. No exchange KYC. NGOs can sponsor your gas fees.",
    Icon: BadgeDollarSign
  },
  {
    title: "EVM Compatible",
    text: "Battle-tested Solidity. Open source. Auditable by anyone.",
    Icon: Blocks
  },
  {
    title: "Post-Quantum Roadmap",
    badge: "[AT MAINNET LAUNCH]",
    text:
      "Arc mainnet launches with SLH-DSA-SHA2-128s wallet signatures. Arc Privacy adds X-Wing KEM encryption against harvest-now, decrypt-later attacks. Your vault documents stay secure in the quantum era.",
    Icon: LockKeyhole
  }
];

export function WhyArc() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr]">
        <div data-reveal>
          <p className="text-xs font-bold uppercase text-typeui-secondary">Settlement layer</p>
          <h2 className="mt-3 text-4xl font-bold text-typeui-text sm:text-5xl">Why Arc Blockchain</h2>
          <div className="mt-6 h-2 w-28 bg-typeui-primary" aria-hidden="true" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {arcReasons.map(({ title, text, badge, Icon }) => (
            <article
              data-reveal
              key={title}
              className="border border-typeui-border bg-typeui-surface p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-typeui-primary"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex size-11 shrink-0 items-center justify-center bg-typeui-primary text-typeui-night">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xl font-bold leading-tight text-typeui-text">{title}</h3>
                  {badge ? (
                    <span className="mt-2 inline-flex border border-typeui-secondary px-2 py-1 text-xs font-bold uppercase text-typeui-secondary">
                      {badge}
                    </span>
                  ) : null}
                  <p className="mt-3 text-base leading-7 text-typeui-muted">{text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
