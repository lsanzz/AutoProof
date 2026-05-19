import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ClipboardCheck, Car, Users, CalendarCheck, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function StatCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function DashboardPage() {
  const { profile } = useAuth();
  const [q, setQ] = useState("");

  const stats = useQuery({
    queryKey: ["dashboard-stats", profile?.workshop_id],
    enabled: !!profile,
    queryFn: async () => {
      const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0, 0, 0, 0);
      const [insp, veh, cli, monthInsp] = await Promise.all([
        supabase.from("inspections").select("id", { count: "exact", head: true }),
        supabase.from("vehicles").select("id", { count: "exact", head: true }),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("inspections").select("id", { count: "exact", head: true }).gte("created_at", startMonth.toISOString()),
      ]);
      return {
        insp: insp.count ?? 0, veh: veh.count ?? 0, cli: cli.count ?? 0, month: monthInsp.count ?? 0,
      };
    },
  });

  const recent = useQuery({
    queryKey: ["recent-inspections", profile?.workshop_id, q],
    enabled: !!profile,
    queryFn: async () => {
      let qb = supabase
        .from("inspections")
        .select(`
        id,
        unique_code,
        status,
        entry_datetime,
        service_type,
        created_at,
        vehicle:vehicles(plate, model, brand),
        client:clients(name)
      `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (q) {
        qb = qb.or(`unique_code.ilike.%${q}%`);
      }

      const { data, error } = await qb;

      if (error) throw error;

      return data ?? [];
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Olá, {profile?.name?.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground">Visão geral da sua oficina</p>
        </div>
        <Button asChild size="lg" className="bg-gradient-hero shadow-card">
          <Link to="/vistorias/nova"><Plus className="mr-2 h-4 w-4" /> Nova vistoria</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardCheck} label="Vistorias realizadas" value={stats.data?.insp ?? "—"} />
        <StatCard icon={Car} label="Veículos cadastrados" value={stats.data?.veh ?? "—"} />
        <StatCard icon={Users} label="Clientes cadastrados" value={stats.data?.cli ?? "—"} />
        <StatCard icon={CalendarCheck} label="Vistorias neste mês" value={stats.data?.month ?? "—"} />
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Vistorias recentes</h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por código..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Veículo</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 hidden md:table-cell">Serviço</th>
                <th className="px-4 py-3 hidden md:table-cell">Data</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(recent.data ?? []).map((r: any) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{r.unique_code}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.vehicle?.plate}</div>
                    <div className="text-xs text-muted-foreground">{r.vehicle?.brand} {r.vehicle?.model}</div>
                  </td>
                  <td className="px-4 py-3">{r.client?.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.service_type ?? "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{formatDateTime(r.entry_datetime)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/vistorias/$id" params={{ id: r.id }} className="text-sm text-primary hover:underline">Abrir</Link>
                  </td>
                </tr>
              ))}
              {recent.data?.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Nenhuma vistoria ainda. <Link to="/vistorias/nova" className="text-primary hover:underline">Criar a primeira</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
