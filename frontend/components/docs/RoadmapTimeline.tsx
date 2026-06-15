import { CheckCircle2, Circle, Loader2 } from "lucide-react";

type PhaseStatus = "complete" | "progress" | "planned";
type ItemStatus = "complete" | "progress" | "planned";

const phases: ReadonlyArray<{
  phase: string;
  title: string;
  status: PhaseStatus;
  statusLabel: string;
  items: ReadonlyArray<{
    status: ItemStatus;
    title: string;
    algorithm?: string;
    timing?: string;
    description?: string;
    tag?: string;
    href?: string;
  }>;
}> = [
  {
    phase: "PHASE 1",
    title: "FOUNDATION",
    status: "complete",
    statusLabel: "COMPLETE",
    items: [
      { status: "complete", title: "Smart contract deployed on Arc Testnet" },
      { status: "complete", title: "Dead man's switch logic" },
      { status: "complete", title: "AES-256-GCM client-side encryption" },
      { status: "complete", title: "IPFS document storage" },
      { status: "complete", title: "Heartbeat system" },
      { status: "complete", title: "Vault dashboard" },
      { status: "complete", title: "Public verification page" },
      { status: "complete", title: "USDC gas on Arc" }
    ]
  },
  {
    phase: "PHASE 2",
    title: "SECURITY",
    status: "progress",
    statusLabel: "IN PROGRESS",
    items: [
      {
        status: "progress",
        title: "Keeper Bot",
        description:
          "Automated service that monitors all vaults and calls activateTrigger() when timers expire. Without this, someone must manually trigger."
      },
      {
        status: "progress",
        title: "Distress Code",
        description:
          "A secondary heartbeat code that secretly triggers the vault while appearing normal. For use under duress or coercion."
      },
      {
        status: "planned",
        title: "Multi-Signature Heartbeat",
        description: "Require 2-of-3 trusted contacts to send heartbeat. Prevents single point of failure."
      },
      {
        status: "planned",
        title: "Timelock on Modifications",
        description:
          "48-hour delay before any vault setting can be changed. Prevents rushed modifications under pressure."
      }
    ]
  },
  {
    phase: "PHASE 3",
    title: "PRIVACY",
    status: "planned",
    statusLabel: "PLANNED",
    items: [
      {
        status: "planned",
        title: "Arc Contact Protection Integration",
        description:
          "Upcoming Arc feature dependency. Once available, vault owners can be shielded from on-chain identity correlation. It is not live in Obsidian today.",
        tag: "WAITING FOR ARC",
        href: "https://docs.arc.io"
      },
      {
        status: "planned",
        title: "Stealth Addresses",
        description: "Generate a fresh one-time address for each vault. No link between vaults or to your main identity."
      },
      {
        status: "planned",
        title: "Private Heartbeat Transactions",
        description: "Heartbeat transactions that do not reveal the vault address publicly."
      }
    ]
  },
  {
    phase: "PHASE 4",
    title: "RESILIENCE",
    status: "planned",
    statusLabel: "PLANNED",
    items: [
      {
        status: "planned",
        title: "Multiple Files Per Vault",
        description: "Upload entire document folders, not just single files."
      },
      {
        status: "planned",
        title: "Redundant IPFS Pinning",
        description: "Automatic pinning across multiple IPFS providers simultaneously."
      },
      {
        status: "planned",
        title: "Email + Telegram Notifications",
        description: "Alerts when heartbeat is due. 48-hour warning and 24-hour critical warning."
      },
      {
        status: "planned",
        title: "Beneficiary Notification System",
        description: "When trigger activates, automatically notify designated beneficiaries."
      }
    ]
  },
  {
    phase: "PHASE 5",
    title: "PRODUCTION",
    status: "planned",
    statusLabel: "FUTURE",
    items: [
      {
        status: "planned",
        title: "Arc Mainnet Deployment",
        description: "Deploy to Arc Mainnet when stable. Real USDC. Real finality."
      },
      {
        status: "planned",
        title: "Post-Quantum Wallet Signatures",
        algorithm: "SLH-DSA-SHA2-128s",
        timing: "Arc Mainnet Launch",
        description:
          "Arc mainnet launches with beta support for SLH-DSA-SHA2-128s post-quantum wallet signatures. Adoption is opt-in. Protects user funds against signature forgery by quantum computers.",
        tag: "[WAITING FOR ARC MAINNET]"
      },
      {
        status: "planned",
        title: "Post-Quantum Privacy",
        algorithm: "X-Wing KEM (X25519 + ML-KEM-768)",
        timing: "Near-term after mainnet",
        description:
          "When Arc Privacy launches, encrypted vault data uses post-quantum cryptography (X-Wing KEM with AES-256-GCM). Protects against harvest-now, decrypt-later attacks - where state actors collect encrypted data today and decrypt it when quantum computers become practical.",
        tag: "[WAITING FOR ARC PRIVACY]"
      },
      {
        status: "planned",
        title: "Security Audit",
        description: "Independent smart contract audit before mainnet launch."
      },
      {
        status: "planned",
        title: "NGO Partnership Program",
        description: "Formal gas sponsorship program for journalists and human rights organizations."
      },
      {
        status: "planned",
        title: "Mobile App",
        description: "iOS and Android app for heartbeat management on the go."
      }
    ]
  }
];

const phaseStyles = {
  complete: "border-typeui-primary bg-typeui-primary text-typeui-night",
  progress: "border-typeui-warning bg-typeui-warning text-typeui-night",
  planned: "border-typeui-primary/45 bg-typeui-secondary text-typeui-cream"
} satisfies Record<PhaseStatus, string>;

export function RoadmapTimeline() {
  return (
    <section className="border border-typeui-primary/45 bg-typeui-night p-4 text-typeui-cream shadow-terminal sm:p-5">
      <div className="relative space-y-8 before:absolute before:left-5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-typeui-primary/35">
        {phases.map((phase) => (
          <article key={`${phase.phase}-${phase.title}`} className="relative pl-14">
            <div className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center border ${phaseStyles[phase.status]}`}>
              <PhaseIcon status={phase.status} />
            </div>
            <div className="border border-typeui-primary/35 bg-typeui-secondary/25">
              <header className="flex flex-col gap-3 border-b border-typeui-primary/25 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-typeui-primary">{phase.phase}</p>
                  <h3 className="mt-1 text-xl font-bold uppercase text-typeui-cream">{phase.title}</h3>
                </div>
                <span className={`w-fit border px-3 py-2 text-xs font-bold uppercase ${phaseStyles[phase.status]}`}>
                  {phase.statusLabel}
                </span>
              </header>

              <ul className="grid gap-3 p-4">
                {phase.items.map((item) => (
                  <li key={`${phase.phase}-${item.title}`} className="border border-typeui-primary/25 bg-typeui-night/65 p-3">
                    <div className="flex items-start gap-3">
                      <ItemIcon status={item.status} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.href ? (
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold uppercase text-typeui-cream underline-offset-4 hover:text-typeui-primary hover:underline"
                            >
                              {item.title}
                            </a>
                          ) : (
                            <h4 className="font-bold uppercase text-typeui-cream">{item.title}</h4>
                          )}
                          {item.tag ? (
                            <span className="border border-typeui-primary/45 px-2 py-1 text-[0.68rem] font-bold uppercase text-typeui-primary">
                              {item.tag}
                            </span>
                          ) : null}
                        </div>
                        {item.algorithm || item.timing ? (
                          <div className="mt-2 flex flex-wrap gap-2 text-[0.72rem] font-bold uppercase text-typeui-primary">
                            {item.algorithm ? (
                              <span className="border border-typeui-primary/35 px-2 py-1">{item.algorithm}</span>
                            ) : null}
                            {item.timing ? (
                              <span className="border border-typeui-primary/35 px-2 py-1">{item.timing}</span>
                            ) : null}
                          </div>
                        ) : null}
                        {item.description ? (
                          <p className="mt-2 text-sm leading-6 text-typeui-cream">{item.description}</p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PhaseIcon({ status }: { status: PhaseStatus }) {
  if (status === "complete") {
    return <CheckCircle2 size={20} aria-hidden="true" />;
  }
  if (status === "progress") {
    return <Loader2 className="animate-spin" size={20} aria-hidden="true" />;
  }
  return <Circle size={18} aria-hidden="true" />;
}

function ItemIcon({ status }: { status: ItemStatus }) {
  if (status === "complete") {
    return <CheckCircle2 className="mt-0.5 shrink-0 text-typeui-primary" size={17} aria-hidden="true" />;
  }
  if (status === "progress") {
    return <Loader2 className="mt-0.5 shrink-0 animate-spin text-typeui-warning" size={17} aria-hidden="true" />;
  }
  return <Circle className="mt-0.5 shrink-0 text-typeui-primary" size={15} aria-hidden="true" />;
}
