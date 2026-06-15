import { Check, X } from "lucide-react";

const protectsAgainst = [
  "Server seizure",
  "Forced disappearance",
  "Document tampering",
  "Blockchain reorganization",
  "Financial surveillance"
];

const doesNotProtect = [
  "Compromised device before encryption",
  "Coerced heartbeat under duress",
  "IPFS unavailability",
  "On-chain identity correlation",
  "Quantum attacks today (roadmap pending)"
];

export function ThreatModel() {
  return (
    <section className="bg-typeui-night px-4 py-20 text-typeui-cream sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div data-reveal className="max-w-3xl">
          <p className="text-xs font-bold uppercase text-typeui-primary">Boundaries</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Threat Model</h2>
          <p className="mt-4 text-xl font-medium text-typeui-cream">What we protect against and what we don&apos;t.</p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <ThreatList title="PROTECTS AGAINST" items={protectsAgainst} variant="positive" />
          <ThreatList title="DOES NOT PROTECT" items={doesNotProtect} variant="negative" />
        </div>
      </div>
    </section>
  );
}

function ThreatList({
  title,
  items,
  variant
}: {
  title: string;
  items: string[];
  variant: "positive" | "negative";
}) {
  const isPositive = variant === "positive";

  return (
    <article data-reveal className="border border-typeui-primary/40 bg-typeui-secondary p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-typeui-primary">
      <h3 className="text-sm font-bold uppercase text-typeui-primary">{title}</h3>
      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-base leading-7 text-typeui-cream">
            <span
              className={`mt-1 inline-flex size-6 shrink-0 items-center justify-center border ${
                isPositive ? "border-typeui-success text-typeui-success" : "border-typeui-danger text-typeui-danger"
              }`}
              aria-hidden="true"
            >
              {isPositive ? <Check size={15} /> : <X size={15} />}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
