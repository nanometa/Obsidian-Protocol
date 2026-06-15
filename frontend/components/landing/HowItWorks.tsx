import { ArrowRight } from "lucide-react";

const steps = [
  {
    id: "01",
    title: "ENCRYPT",
    text: "Documents never leave your device unencrypted. AES-256-GCM encryption in your browser only."
  },
  {
    id: "02",
    title: "UPLOAD",
    text: "Only encrypted payload reaches IPFS. The AES key is split into two age-encrypted shares."
  },
  {
    id: "03",
    title: "ARM",
    text: "Immutable smart contract on Arc blockchain. Sub-second finality. No re-org possible."
  },
  {
    id: "04",
    title: "SURVIVE",
    text: "Miss your heartbeat and Part B is revealed through the trigger. Beneficiaries recombine both parts in-browser."
  }
];

export function HowItWorks() {
  return (
    <section className="bg-typeui-secondary px-4 py-20 text-typeui-cream sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div data-reveal className="max-w-3xl">
          <p className="text-xs font-bold uppercase text-typeui-primary">Release mechanism</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">How It Works</h2>
          <p className="mt-4 text-xl font-medium text-typeui-cream">Four steps. No trust required.</p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div data-reveal key={step.id} className="relative">
              <article className="h-full border border-typeui-primary/45 bg-typeui-cream p-5 text-typeui-text transition-all duration-200 ease-out hover:-translate-y-1 hover:border-typeui-secondary">
                <p className="font-mono text-sm font-bold text-typeui-secondary">Step {step.id}</p>
                <h3 className="mt-4 text-2xl font-bold">{step.title}</h3>
                <p className="mt-4 text-base leading-7 text-typeui-muted">{step.text}</p>
              </article>
              {index < steps.length - 1 ? (
                <ArrowRight
                  className="absolute -right-4 top-1/2 hidden -translate-y-1/2 bg-typeui-secondary text-typeui-cream lg:block"
                  size={24}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
