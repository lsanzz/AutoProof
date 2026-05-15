import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em andamento", cls: "bg-warning/15 text-warning-foreground border border-warning/40" },
  finalized: { label: "Finalizada", cls: "bg-success/15 text-success border border-success/30" },
};

export function StatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, cls: "bg-muted" };
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", m.cls)}>{m.label}</span>;
}
