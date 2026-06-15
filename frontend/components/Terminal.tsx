import type { ReactNode } from "react";

type TerminalProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Terminal({ title, children, className = "" }: TerminalProps) {
  return (
    <section className={`terminal-border bg-obsidian-black shadow-terminal ${className}`}>
      {title ? (
        <header className="flex min-h-10 items-center justify-between border-b border-obsidian-green/30 px-4 text-xs text-obsidian-dim">
          <span className="font-semibold uppercase">{title}</span>
          <span className="font-semibold text-obsidian-green">ONLINE</span>
        </header>
      ) : null}
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}
