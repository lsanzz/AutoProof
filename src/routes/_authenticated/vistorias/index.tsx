import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/vistorias/")({
  component: ListInspections,
});

function ListInspections() {
  const [q, setQ] = useState("");
  const list = useQuery({
    queryKey: ["inspections-list", q],
    queryFn: async () => {
      let qb = supabase
        .from("inspections")
        .select(`id, unique_code, status, entry_datetime, service_type,
                 vehicle:vehicles(plate, model, brand), client:clients(name),
                 inspector:profiles!inspections_user_id_fkey(name)`)
        .order("created_at", { ascending: false });
      if (q) qb = qb.or(`unique_code.ilike.%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Vistorias</h1>
          <p className="text-sm text-muted-foreground">Todas as vistorias realizadas</p>
        </div>
        <Button asChild className="bg-gradient-hero">
          <Link to="/vistorias/nova"><Plus className="mr-2 h-4 w-4" /> Nova vistoria</Link>
        </Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por código..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Veículo</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 hidden md:table-cell">Serviço</th>
              <th className="px-4 py-3 hidden md:table-cell">Data</th>
              <th className="px-4 py-3">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{r.unique_code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{r.vehicle?.plate}</div>
                  <div className="text-xs text-muted-foreground">{r.vehicle?.brand} {r.vehicle?.model}</div>
                </td>
                <td className="px-4 py-3">{r.client?.name}</td>
                <td className="px-4 py-3 hidden md:table-cell">{r.service_type ?? "—"}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{formatDateTime(r.entry_datetime)}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link to="/vistorias/$id" params={{ id: r.id }} className="text-sm text-primary hover:underline">Abrir</Link>
                </td>
              </tr>
            ))}
            {list.data?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma vistoria ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
