import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Car } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/veiculos")({
  component: VehiclesPage,
});

function VehiclesPage() {
  const [q, setQ] = useState("");
  const list = useQuery({
    queryKey: ["vehicles", q],
    queryFn: async () => {
      let qb = supabase.from("vehicles").select(`*, client:clients(name)`).order("created_at", { ascending: false });
      if (q) qb = qb.or(`plate.ilike.%${q}%,model.ilike.%${q}%,brand.ilike.%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Veículos</h1>
        <p className="text-sm text-muted-foreground">Veículos cadastrados nas vistorias</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por placa, modelo..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(list.data ?? []).map((v: any) => (
          <div key={v.id} className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-sm font-bold uppercase">{v.plate}</div>
                <div className="font-semibold">{v.brand} {v.model}</div>
                <div className="text-xs text-muted-foreground">{v.year} • {v.color}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Car className="h-4 w-4" /></div>
            </div>
            {v.client?.name && <div className="mt-3 text-xs text-muted-foreground">Cliente: <span className="font-medium text-foreground">{v.client.name}</span></div>}
          </div>
        ))}
        {list.data?.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhum veículo cadastrado ainda. Cadastre durante uma nova vistoria.
          </div>
        )}
      </div>
    </div>
  );
}
