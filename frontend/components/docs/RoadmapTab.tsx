import { ExternalLink, ShieldAlert } from "lucide-react";
import { RoadmapTimeline } from "./RoadmapTimeline";

export function RoadmapTab() {
  return (
    <div className="space-y-5">
      <section className="border border-typeui-primary/45 bg-typeui-night p-4 text-typeui-cream shadow-terminal sm:p-5">
        <p className="text-xs font-bold uppercase text-typeui-primary">Roadmap</p>
        <h2 className="mt-2 text-3xl font-bold uppercase text-typeui-cream">Roadmap</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-typeui-cream">
          What exists today and what is coming.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 border border-typeui-warning bg-typeui-warning px-4 py-3 text-sm font-bold uppercase text-typeui-night">
          <ShieldAlert size={18} aria-hidden="true" />
          TESTNET - NOT FOR PRODUCTION USE
        </div>
      </section>

      <RoadmapTimeline />

      <section className="border border-typeui-primary/45 bg-typeui-night p-4 text-typeui-cream shadow-terminal sm:p-5">
        <h2 className="text-xl font-bold uppercase text-typeui-cream">Want to contribute or report a vulnerability?</h2>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a
            href="#"
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-typeui-primary bg-typeui-primary px-4 text-sm font-bold uppercase text-typeui-night hover:bg-typeui-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-primary"
          >
            VIEW ON GITHUB
            <ExternalLink size={16} aria-hidden="true" />
          </a>
          <a
            href="mailto:security@obsidian-protocol.xyz"
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-typeui-primary px-4 text-sm font-bold uppercase text-typeui-primary hover:bg-typeui-primary hover:text-typeui-night focus:outline-none focus-visible:ring-2 focus-visible:ring-typeui-primary"
          >
            SECURITY DISCLOSURE
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
