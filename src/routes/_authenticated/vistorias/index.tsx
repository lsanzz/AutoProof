import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vistorias/")({
  component: ListInspections,
});

function ListInspections() {
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["inspections-list", q],
    queryFn: async () => {
      let qb = supabase
        .from("inspections")
        .select(`
          id,
          unique_code,
          status,
          entry_datetime,
          service_type,
          vehicle:vehicles(plate, model, brand),
          client:clients(name)
        `)
        .order("created_at", { ascending: false });

      if (q) {
        qb = qb.or(`unique_code.ilike.%${q}%`);
      }

      const { data, error } = await qb;

      if (error) throw error;

      return data ?? [];
    },
  });

  const deleteInspection = async (inspection: any) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja apagar a vistoria ${inspection.unique_code}?\n\nEssa ação não pode ser desfeita.`,
    );

    if (!confirmed) return;

    setDeletingId(inspection.id);

    try {
      const { error: reportsErr } = await supabase
        .from("reports")
        .delete()
        .eq("inspection_id", inspection.id);

      if (reportsErr) throw reportsErr;

      const { error: signaturesErr } = await supabase
        .from("signatures")
        .delete()
        .eq("inspection_id", inspection.id);

      if (signaturesErr) throw signaturesErr;

      const { error: photosErr } = await supabase
        .from("photos")
        .delete()
        .eq("inspection_id", inspection.id);

      if (photosErr) throw photosErr;

      const { error: damagesErr } = await supabase
        .from("damages")
        .delete()
        .eq("inspection_id", inspection.id);

      if (damagesErr) throw damagesErr;

      const { error: areasErr } = await supabase
        .from("inspection_areas")
        .delete()
        .eq("inspection_id", inspection.id);

      if (areasErr) throw areasErr;

      const { error: inspectionErr } = await supabase
        .from("inspections")
        .delete()
        .eq("id", inspection.id);

      if (inspectionErr) throw inspectionErr;

      toast.success("Vistoria apagada com sucesso");

      qc.invalidateQueries({ queryKey: ["inspections-list"] });
      qc.invalidateQueries({ queryKey: ["recent-inspections"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (e: any) {
      console.error("[delete inspection]", e);
      toast.error(e?.message ?? "Erro ao apagar vistoria");
    } finally {
      setDeletingId(null);
    }
  };

  const inspections = list.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Vistorias</h1>
          <p className="text-sm text-muted-foreground">
            Todas as vistorias realizadas
          </p>
        </div>

        <Button asChild className="bg-gradient-hero">
          <Link to="/vistorias/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova vistoria
          </Link>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          className="pl-9"
          placeholder="Buscar por código..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {inspections.map((r: any) => (
          <div key={r.id} className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-xs text-muted-foreground">
                  {r.unique_code}
                </div>

                <div className="mt-1 text-base font-semibold">
                  {r.vehicle?.plate || "Veículo sem placa"}
                </div>

                <div className="text-sm text-muted-foreground">
                  {r.vehicle?.brand} {r.vehicle?.model}
                </div>
              </div>

              <StatusBadge status={r.status} />
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>{" "}
                <span className="font-medium">{r.client?.name ?? "—"}</span>
              </div>

              <div>
                <span className="text-muted-foreground">Serviço:</span>{" "}
                <span className="font-medium">{r.service_type ?? "—"}</span>
              </div>

              <div>
                <span className="text-muted-foreground">Data:</span>{" "}
                <span className="font-medium">
                  {formatDateTime(r.entry_datetime)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild size="sm" className="w-full bg-gradient-hero">
                <Link to="/vistorias/$id" params={{ id: r.id }}>
                  Abrir vistoria
                </Link>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="w-full"
                disabled={deletingId === r.id}
                onClick={() => deleteInspection(r)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                {deletingId === r.id ? "Apagando..." : "Apagar"}
              </Button>
            </div>
          </div>
        ))}

        {inspections.length === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma vistoria ainda.
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Veículo</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Serviço</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>

          <tbody>
            {inspections.map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">
                  {r.unique_code}
                </td>

                <td className="px-4 py-3">
                  <div className="font-medium">{r.vehicle?.plate}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.vehicle?.brand} {r.vehicle?.model}
                  </div>
                </td>

                <td className="px-4 py-3">{r.client?.name}</td>

                <td className="px-4 py-3">{r.service_type ?? "—"}</td>

                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(r.entry_datetime)}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/vistorias/$id" params={{ id: r.id }}>
                        Abrir
                      </Link>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={deletingId === r.id}
                      onClick={() => deleteInspection(r)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      {deletingId === r.id ? "Apagando..." : "Apagar"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {inspections.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  Nenhuma vistoria ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}