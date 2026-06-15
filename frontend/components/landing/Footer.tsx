import Link from "next/link";

const platformLinks = [
  { label: "Initialize Vault", href: "/vault/new", internal: true },
  { label: "Verify a Vault", href: "/verify", internal: true },
  { label: "Documentation", href: "/docs", internal: true }
] as const;

const technicalLinks = [
  { label: "Smart Contract", href: "https://testnet.arcscan.app" },
  { label: "GitHub", href: "https://github.com" }
] as const;

const resourceLinks = [
  { label: "Arc Blockchain", href: "https://docs.arc.io" },
  { label: "IPFS", href: "https://ipfs.tech" },
  { label: "age encryption", href: "https://age-encryption.org" }
] as const;

export function Footer() {
  return (
    <footer className="bg-typeui-ember px-4 py-12 text-typeui-cream sm:px-6 lg:px-8">
      <div data-reveal className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.4fr_2fr]">
        <div>
          <h2 className="text-2xl font-bold uppercase">OBSIDIAN PROTOCOL</h2>
          <p className="mt-3 max-w-sm text-base leading-7 text-typeui-cream">Built for those who cannot stay silent.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <FooterColumn title="Platform" links={platformLinks} />
          <FooterColumn title="Technical" links={technicalLinks} />
          <FooterColumn title="Resources" links={resourceLinks} />
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-typeui-primary/25 pt-6">
        <p className="text-xs font-medium text-typeui-primary">
          Deployed on Arc Testnet - Not for production - No data collected - No cookies - No analytics
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string; internal?: boolean }>;
}) {
  return (
    <nav aria-label={title}>
      <h3 className="text-sm font-bold uppercase text-typeui-primary">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            {link.internal ? (
              <Link
                href={link.href}
                className="text-sm font-medium text-typeui-cream underline-offset-4 hover:text-typeui-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-primary"
              >
                {link.label}
              </Link>
            ) : (
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-typeui-cream underline-offset-4 hover:text-typeui-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-primary"
              >
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
