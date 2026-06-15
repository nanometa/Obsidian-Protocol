import { Mail } from "lucide-react";

const networkStats = [
  ["Active Vaults", "---"],
  ["Documents", "---"],
  ["Network", "Arc"],
  ["Uptime", "100%"]
] as const;

export function ForOrganizations() {
  return (
    <section className="bg-typeui-cream px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div data-reveal className="max-w-3xl">
          <p className="text-xs font-bold uppercase text-typeui-secondary">Sponsored access</p>
          <h2 className="mt-3 text-4xl font-bold text-typeui-text sm:text-5xl">For Organizations</h2>
          <p className="mt-6 text-xl font-medium leading-9 text-typeui-muted">
            Running a newsroom or NGO? Sponsor gas fees for your journalists. One USDC deposit covers hundreds of vault
            deployments. Your reporters never touch a crypto exchange.
          </p>
          <a
            href="mailto:contact@obsidian-protocol.xyz"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 border border-typeui-primary bg-typeui-primary px-5 py-3 text-sm font-bold uppercase text-typeui-night transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-typeui-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-night focus-visible:ring-offset-2 focus-visible:ring-offset-typeui-cream"
          >
            <Mail size={18} aria-hidden="true" />
            [CONTACT FOR NGO ACCESS]
          </a>
        </div>
        <aside data-reveal className="border border-typeui-primary bg-typeui-night p-6 text-typeui-cream shadow-poster">
          <h3 className="font-mono text-sm font-bold uppercase text-typeui-primary">NETWORK STATUS</h3>
          <dl className="mt-8 space-y-4 font-mono text-sm">
            {networkStats.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[1fr_auto] gap-4 border-b border-typeui-primary/25 pb-3">
                <dt className="text-typeui-cream">{label}:</dt>
                <dd className="font-bold text-typeui-cream">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}
