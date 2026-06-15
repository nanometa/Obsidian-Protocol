import type { VaultStatusLabel } from "@/lib/contract";

type VaultStatusProps = {
  status: VaultStatusLabel;
};

const styles: Record<VaultStatusLabel, string> = {
  NONE: "border-obsidian-dim text-obsidian-dim",
  ACTIVE: "border-obsidian-green text-obsidian-green",
  EXPIRED: "border-obsidian-warning text-obsidian-warning",
  TRIGGERED: "border-obsidian-white text-obsidian-white"
};

export function VaultStatus({ status }: VaultStatusProps) {
  return (
    <span className={`inline-flex min-h-8 items-center border px-3 text-xs font-bold ${styles[status]}`}>
      {status}
    </span>
  );
}
