import type { LucideIcon } from "lucide-react";
import { FileWarning, RadioTower, UserX } from "lucide-react";

const problems: Array<{ title: string; text: string; Icon: LucideIcon }> = [
  {
    title: "Quantum Harvest Attack",
    text: "State actors collect encrypted communications today. Quantum computers will crack them in 10 years. Your secrets have an expiry date.",
    Icon: RadioTower
  },
  {
    title: "Server Seizure",
    text: "Traditional platforms run on servers with addresses, owners, and legal vulnerabilities. One court order. Everything gone.",
    Icon: FileWarning
  },
  {
    title: "Forced Disappearance",
    text: "If you cannot speak, your evidence dies with you. Intimidation works because silence is easy to enforce. Until now.",
    Icon: UserX
  }
];

export function ProblemSection() {
  return (
    <section className="bg-typeui-cream px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div data-reveal className="max-w-3xl">
          <p className="text-xs font-bold uppercase text-typeui-secondary">Risk surface</p>
          <h2 className="mt-3 text-4xl font-bold text-typeui-text sm:text-5xl">The Problem</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {problems.map(({ title, text, Icon }) => (
            <article
              data-reveal
              key={title}
              className="border border-typeui-border bg-typeui-card p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-typeui-primary"
            >
              <div className="mb-6 inline-flex size-12 items-center justify-center bg-typeui-secondary text-typeui-cream">
                <Icon size={22} aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold leading-tight text-typeui-text">{title}</h3>
              <p className="mt-4 text-base leading-7 text-typeui-muted">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
