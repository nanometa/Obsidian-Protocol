import { AlertTriangle, CheckCircle2, FileText, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { ContractReference } from "./ContractReference";
import { EncryptionDiagram } from "./EncryptionDiagram";
import { FAQ } from "./FAQ";
import { SetupGuide } from "./SetupGuide";

const protectsAgainst = [
  "Server seizure - no central server exists",
  "Forced disappearance - expired timers can be triggered by anyone or the keeper bot",
  "Document tampering - IPFS hash is immutable",
  "Blockchain re-org - Arc sub-second finality",
  "Financial surveillance - USDC gas, no KYC needed",
  "Single point of failure - fully decentralized"
] as const;

const limitations = [
  {
    risk: "Compromised device before encryption",
    mitigation: "Always encrypt on a trusted, clean device"
  },
  {
    risk: "Coerced heartbeat under duress",
    mitigation: "Use a trusted contact as backup"
  },
  {
    risk: "IPFS file unavailability",
    mitigation: "Pin your files on multiple services"
  },
  {
    risk: "On-chain identity correlation",
    mitigation: "Use a fresh wallet with no transaction history"
  },
  {
    risk: "Raw public-chain storage inspection",
    mitigation: "Do not treat EVM storage as private; production release shares should stay off-chain until trigger"
  },
  {
    risk: "Quantum attacks today",
    mitigation: "Post-quantum features are on Arc's roadmap and not yet available"
  }
] as const;

export function DocsTab() {
  return (
    <div className="space-y-5">
      <DocSection
        eyebrow="01 / Protocol"
        title="What is Obsidian Protocol"
        icon={<FileText size={20} aria-hidden="true" />}
      >
        <div className="space-y-4 text-sm leading-7 text-typeui-cream sm:text-base">
          <p>
            Obsidian Protocol is a cryptographic dead man&apos;s switch deployed on Arc blockchain. It guarantees
            that sensitive documents are automatically published if their owner cannot confirm they are safe.
          </p>
          <p>
            No central server. No admin keys. No way to stop it once armed. The contract is immutable - not even
            the developers can interfere.
          </p>
        </div>
      </DocSection>

      <DocSection
        eyebrow="02 / Technical"
        title="How It Works"
        icon={<ShieldCheck size={20} aria-hidden="true" />}
      >
        <EncryptionDiagram />
      </DocSection>

      <DocSection
        eyebrow="03 / Contract"
        title="Smart Contract Reference"
        icon={<FileText size={20} aria-hidden="true" />}
      >
        <ContractReference />
      </DocSection>

      <DocSection
        eyebrow="04 / Security"
        title="What Obsidian Protects Against"
        icon={<ShieldAlert size={20} aria-hidden="true" />}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="border border-typeui-primary/35 bg-typeui-secondary/30 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-typeui-primary">
              <CheckCircle2 size={18} aria-hidden="true" />
              Protects Against
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-typeui-cream">
              {protectsAgainst.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-typeui-primary" size={16} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-typeui-primary/35 bg-typeui-secondary/30 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-typeui-warning">
              <AlertTriangle size={18} aria-hidden="true" />
              Does Not Protect Against
            </h3>
            <ul className="mt-4 space-y-4 text-sm leading-6 text-typeui-cream">
              {limitations.map((item) => (
                <li key={item.risk} className="space-y-1">
                  <div className="flex gap-2">
                    <XCircle className="mt-0.5 shrink-0 text-typeui-warning" size={16} aria-hidden="true" />
                    <span>{item.risk}</span>
                  </div>
                  <p className="pl-6 text-typeui-primary">{item.mitigation}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 border border-typeui-primary/35 bg-typeui-secondary/30 p-4 text-sm leading-7 text-typeui-cream">
          <h3 className="text-sm font-bold uppercase text-typeui-primary">Post-Quantum Security</h3>
          <p className="mt-3">
            Obsidian Protocol currently runs on Arc Testnet with standard EVM cryptography. Post-quantum features
            are on Arc&apos;s roadmap and not yet available.
          </p>
          <p className="mt-3">
            When Arc Mainnet launches: wallet signatures upgrade to SLH-DSA-SHA2-128s. Adoption is opt-in, with no
            action required from vault owners.
          </p>
          <p className="mt-3">
            When Arc Privacy launches: encrypted state is protected by X-Wing KEM (X25519 + ML-KEM-768 with
            AES-256-GCM), with full protection against harvest-now, decrypt-later attacks.
          </p>
          <p className="mt-3">
            This matters because blockchain data is permanent. Documents sealed today must remain secure in 10+
            years when quantum computers may become practical.
          </p>
        </div>
      </DocSection>

      <DocSection
        eyebrow="05 / Setup"
        title="Get Started in 5 Steps"
        icon={<ShieldCheck size={20} aria-hidden="true" />}
      >
        <SetupGuide />
      </DocSection>

      <DocSection eyebrow="06 / FAQ" title="FAQ" icon={<FileText size={20} aria-hidden="true" />}>
        <FAQ />
      </DocSection>
    </div>
  );
}

function DocSection({
  eyebrow,
  title,
  icon,
  children
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-typeui-primary/45 bg-typeui-night text-typeui-cream shadow-terminal">
      <header className="flex flex-col gap-3 border-b border-typeui-primary/35 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-bold uppercase text-typeui-primary">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold uppercase text-typeui-cream">{title}</h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center border border-typeui-primary text-typeui-primary">
          {icon}
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
