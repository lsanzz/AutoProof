import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Car, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/veiculos")({
  component: VehiclesPage,
});

type VehicleForm = {
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  mileage: string;
};

const emptyVehicleForm: VehicleForm = {
  plate: "",
  brand: "",
  model: "",
  year: "",
  color: "",
  mileage: "",
};

function VehiclesPage() {
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyVehicleForm);

  const list = useQuery({
    queryKey: ["vehicles", q],
    queryFn: async () => {
      let query = supabase
        .from("vehicles")
        .select("*, client:clients(name)")
        .order("created_at", { ascending: false });

      if (q) {
        query = query.or(`plate.ilike.%${q}%,model.ilike.%${q}%,brand.ilike.%${q}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data ?? [];
    },
  });

  const openEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setForm({
      plate: vehicle.plate ?? "",
      brand: vehicle.brand ?? "",
      model: vehicle.model ?? "",
      year: vehicle.year ? String(vehicle.year) : "",
      color: vehicle.color ?? "",
      mileage: vehicle.mileage ? String(vehicle.mileage) : "",
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingVehicle) return;

    if (!form.plate.trim()) {
      toast.error("Informe a placa do veículo.");
      return;
    }

    const { error } = await supabase
      .from("vehicles")
      .update({
        plate: form.plate.trim().toUpperCase(),
        brand: form.brand || null,
        model: form.model || null,
        year: form.year ? parseInt(form.year) : null,
        color: form.color || null,
        mileage: form.mileage ? parseInt(form.mileage) : null,
      })
      .eq("id", editingVehicle.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Veículo atualizado");
    setOpen(false);
    setEditingVehicle(null);
    setForm(emptyVehicleForm);
    qc.invalidateQueries({ queryKey: ["vehicles"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Veículos</h1>
        <p className="text-sm text-muted-foreground">
          Veículos cadastrados nas vistorias
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por placa, modelo..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(list.data ?? []).map((vehicle: any) => (
          <div
            key={vehicle.id}
            className="rounded-xl border bg-card p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-sm font-bold uppercase">
                  {vehicle.plate}
                </div>

                <div className="font-semibold">
                  {vehicle.brand} {vehicle.model}
                </div>

                <div className="text-xs text-muted-foreground">
                  {vehicle.year || "—"} • {vehicle.color || "—"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Car className="h-4 w-4" />
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(vehicle)}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Editar
                </Button>
              </div>
            </div>

            {vehicle.mileage && (
              <div className="mt-2 text-xs text-muted-foreground">
                Quilometragem:{" "}
                <span className="font-medium text-foreground">
                  {vehicle.mileage} km
                </span>
              </div>
            )}

            {vehicle.client?.name && (
              <div className="mt-3 text-xs text-muted-foreground">
                Cliente:{" "}
                <span className="font-medium text-foreground">
                  {vehicle.client.name}
                </span>
              </div>
            )}
          </div>
        ))}

        {list.data?.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhum veículo cadastrado ainda. Cadastre durante uma nova vistoria.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar veículo</DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Placa</Label>
              <Input
                required
                value={form.plate}
                onChange={(e) =>
                  setForm({ ...form, plate: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Marca</Label>
                <Input
                  value={form.brand}
                  onChange={(e) =>
                    setForm({ ...form, brand: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Modelo</Label>
                <Input
                  value={form.model}
                  onChange={(e) =>
                    setForm({ ...form, model: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>Ano</Label>
                <Input
                  value={form.year}
                  onChange={(e) =>
                    setForm({ ...form, year: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Cor</Label>
                <Input
                  value={form.color}
                  onChange={(e) =>
                    setForm({ ...form, color: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Quilometragem</Label>
                <Input
                  value={form.mileage}
                  onChange={(e) =>
                    setForm({ ...form, mileage: e.target.value })
                  }
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-hero">
              Salvar alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}