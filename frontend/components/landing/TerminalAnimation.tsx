"use client";

import { useEffect, useState } from "react";

const TERMINAL_TEXT = [
  "> obsidian init --timer 14d",
  "> Generating AES-256-GCM key... [OK]",
  "> Encrypting payload...         [OK]",
  "> Uploading to IPFS...          [OK]",
  "> Hash: QmX7b3hF9kL2m...        [OK]",
  "> Deploying to Arc Testnet...   [OK]",
  "> Vault address: 0x7F3a...      [OK]",
  "> Dead man's switch: ARMED      [OK]",
  ">",
  "> Next heartbeat in: 13d 23h 59m 41s",
  "> _"
].join("\n");

export function TerminalAnimation() {
  const [displayText, setDisplayText] = useState(TERMINAL_TEXT);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealTargets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let index = 0;
    let intervalId: number | undefined;
    let pauseId: number | undefined;

    const startTyping = () => {
      window.clearInterval(intervalId);
      window.clearTimeout(pauseId);
      index = 0;
      setDisplayText("");

      intervalId = window.setInterval(() => {
        index += 1;
        setDisplayText(TERMINAL_TEXT.slice(0, index));

        if (index >= TERMINAL_TEXT.length) {
          window.clearInterval(intervalId);
          pauseId = window.setTimeout(startTyping, 2000);
        }
      }, 30);
    };

    const bootId = window.setTimeout(startTyping, 400);

    return () => {
      window.clearTimeout(bootId);
      window.clearInterval(intervalId);
      window.clearTimeout(pauseId);
    };
  }, []);

  return (
    <aside className="border border-typeui-primary/60 bg-typeui-night p-4 shadow-poster lg:p-6" aria-label="Vault creation terminal">
      <div className="mb-5 flex items-center justify-between border-b border-typeui-primary/30 pb-3">
        <span className="font-mono text-xs font-bold uppercase text-typeui-primary">obsidian://vault-init</span>
        <span className="border border-typeui-primary px-2 py-1 font-mono text-[11px] font-bold uppercase text-typeui-cream">
          Armed
        </span>
      </div>
      <pre className="min-h-[22rem] whitespace-pre-wrap break-words font-mono text-sm leading-7 text-typeui-cream">
        {displayText}
      </pre>
    </aside>
  );
}
