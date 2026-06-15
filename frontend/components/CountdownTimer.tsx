"use client";

import { useEffect, useMemo, useState } from "react";

type CountdownTimerProps = {
  deadline: bigint | number | string;
};

type TimeParts = {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function CountdownTimer({ deadline }: CountdownTimerProps) {
  const deadlineSeconds = useMemo(() => Number(deadline), [deadline]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = splitTime(Math.max(0, Math.floor(deadlineSeconds - now / 1000)));
  const warning = parts.totalSeconds > 0 && parts.totalSeconds < 48 * 60 * 60;

  return (
    <div
      className={`grid grid-cols-4 gap-2 text-center ${warning ? "text-obsidian-warning" : "text-obsidian-green"}`}
      aria-label="vault countdown"
    >
      <TimeCell label="DAYS" value={parts.days} />
      <TimeCell label="HRS" value={parts.hours} />
      <TimeCell label="MIN" value={parts.minutes} />
      <TimeCell label="SEC" value={parts.seconds} />
    </div>
  );
}

function TimeCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="terminal-border min-w-0 px-2 py-3">
      <div className="font-mono text-2xl font-bold tabular-nums sm:text-4xl">{String(value).padStart(2, "0")}</div>
      <div className="mt-1 text-[10px] text-obsidian-dim sm:text-xs">{label}</div>
    </div>
  );
}

function splitTime(totalSeconds: number): TimeParts {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { totalSeconds, days, hours, minutes, seconds };
}
