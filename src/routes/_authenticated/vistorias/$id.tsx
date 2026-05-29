import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReportView } from "@/components/reports/ReportView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DAMAGE_TYPES, VEHICLE_AREAS } from "@/lib/inspection-areas";

export const Route = createFileRoute("/_authenticated/vistorias/$id")({
  component: InspectionDetail,
});

function InspectionDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    service_type: "",
    client_name: "",
    client_phone: "",
    client_email: "",
    client_document_number: "",
    vehicle_plate: "",
    vehicle_brand: "",
    vehicle_model: "",
    vehicle_year: "",
    vehicle_color: "",
    vehicle_mileage: "",
  });

  const [areaNotes, setAreaNotes] = useState<Record<string, string>>({});

  const [newDamage, setNewDamage] = useState({
    area_name: "",
    damage_type: "",
    description: "",
  });

  const [addingDamage, setAddingDamage] = useState(false);
  const [deletingDamageId, setDeletingDamageId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["inspection", id],
    enabled: !!id,
    retry: 1,
    queryFn: async () => {
      const { data: inspection, error: inspectionErr } = await supabase
        .from("inspections")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (inspectionErr) throw inspectionErr;
      if (!inspection) return null;

      const [
        clientRes,
        vehicleRes,
        workshopRes,
        areasRes,
        photosRes,
        damagesRes,
        signatureRes,
      ] = await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .eq("id", inspection.client_id)
          .maybeSingle(),

        supabase
          .from("vehicles")
          .select("*")
          .eq("id", inspection.vehicle_id)
          .maybeSingle(),

        supabase
          .from("workshops")
          .select("*")
          .eq("id", inspection.workshop_id)
          .maybeSingle(),

        supabase
          .from("inspection_areas")
          .select("*")
          .eq("inspection_id", inspection.id)
          .order("created_at", { ascending: true }),

        supabase
          .from("photos")
          .select("*")
          .eq("inspection_id", inspection.id)
          .order("created_at", { ascending: true }),

        supabase
          .from("damages")
          .select("*")
          .eq("inspection_id", inspection.id)
          .order("created_at", { ascending: true }),

        supabase
          .from("signatures")
          .select("*")
          .eq("inspection_id", inspection.id)
          .maybeSingle(),
      ]);

      if (clientRes.error) throw clientRes.error;
      if (vehicleRes.error) throw vehicleRes.error;
      if (workshopRes.error) throw workshopRes.error;
      if (areasRes.error) throw areasRes.error;
      if (photosRes.error) throw photosRes.error;
      if (damagesRes.error) throw damagesRes.error;
      if (signatureRes.error) throw signatureRes.error;

      return {
        ...inspection,
        client: clientRes.data,
        vehicle: vehicleRes.data,
        workshop: workshopRes.data,
        areas: areasRes.data ?? [],
        photos: photosRes.data ?? [],
        damages: damagesRes.data ?? [],
        signature: signatureRes.data,
      };
    },
  });

  useEffect(() => {
    if (!q.data) return;

    setForm({
      service_type: q.data.service_type ?? "",
      client_name: q.data.client?.name ?? "",
      client_phone: q.data.client?.phone ?? "",
      client_email: q.data.client?.email ?? "",
      client_document_number: q.data.client?.document_number ?? "",
      vehicle_plate: q.data.vehicle?.plate ?? "",
      vehicle_brand: q.data.vehicle?.brand ?? "",
      vehicle_model: q.data.vehicle?.model ?? "",
      vehicle_year: q.data.vehicle?.year ? String(q.data.vehicle.year) : "",
      vehicle_color: q.data.vehicle?.color ?? "",
      vehicle_mileage: q.data.vehicle?.mileage
        ? String(q.data.vehicle.mileage)
        : "",
    });

    const notes: Record<string, string> = {};

    for (const area of q.data.areas ?? []) {
      notes[area.id] = area.notes ?? "";
    }

    setAreaNotes(notes);
  }, [q.data]);

  const saveChanges = async () => {
    if (!q.data) return;

    if (!form.client_name.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }

    if (!form.vehicle_plate.trim()) {
      toast.error("Informe a placa do veículo.");
      return;
    }

    setSaving(true);

    try {
      const { error: inspectionErr } = await supabase
        .from("inspections")
        .update({
          service_type: form.service_type || null,
        })
        .eq("id", q.data.id);

      if (inspectionErr) throw inspectionErr;

      const { error: clientErr } = await supabase
        .from("clients")
        .update({
          name: form.client_name.trim(),
          phone: form.client_phone || null,
          email: form.client_email || null,
          document_number: form.client_document_number || null,
        })
        .eq("id", q.data.client_id);

      if (clientErr) throw clientErr;

      const { error: vehicleErr } = await supabase
        .from("vehicles")
        .update({
          plate: form.vehicle_plate.trim().toUpperCase(),
          brand: form.vehicle_brand || null,
          model: form.vehicle_model || null,
          year: form.vehicle_year ? parseInt(form.vehicle_year) : null,
          color: form.vehicle_color || null,
          mileage: form.vehicle_mileage ? parseInt(form.vehicle_mileage) : null,
        })
        .eq("id", q.data.vehicle_id);

      if (vehicleErr) throw vehicleErr;

      for (const area of q.data.areas ?? []) {
        const { error: areaErr } = await supabase
          .from("inspection_areas")
          .update({
            notes: areaNotes[area.id] || null,
          })
          .eq("id", area.id);

        if (areaErr) throw areaErr;
      }

      toast.success("Vistoria atualizada");
      setEditing(false);

      qc.invalidateQueries({ queryKey: ["inspection", id] });
      qc.invalidateQueries({ queryKey: ["inspections-list"] });
      qc.invalidateQueries({ queryKey: ["recent-inspections"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (e: any) {
      console.error("[edit inspection]", e);
      toast.error(e?.message ?? "Erro ao atualizar vistoria");
    } finally {
      setSaving(false);
    }
  };

  const addDamage = async () => {
    if (!q.data) return;

    if (!newDamage.area_name) {
      toast.error("Selecione a peça/área do veículo.");
      return;
    }

    if (!newDamage.damage_type) {
      toast.error("Selecione o tipo de dano.");
      return;
    }

    setAddingDamage(true);

    try {
      let area = (q.data.areas ?? []).find(
        (item: any) => item.area_name === newDamage.area_name,
      );

      if (!area) {
        const { data: createdArea, error: areaErr } = await supabase
          .from("inspection_areas")
          .insert({
            inspection_id: q.data.id,
            area_name: newDamage.area_name,
            has_damage: true,
            notes: null,
          })
          .select()
          .single();

        if (areaErr) throw areaErr;

        area = createdArea;
      } else {
        const { error: updateAreaErr } = await supabase
          .from("inspection_areas")
          .update({
            has_damage: true,
          })
          .eq("id", area.id);

        if (updateAreaErr) throw updateAreaErr;
      }

      const { error: damageErr } = await supabase.from("damages").insert({
        inspection_id: q.data.id,
        inspection_area_id: area.id,
        damage_type: newDamage.damage_type as any,
        description: newDamage.description || null,
      });

      if (damageErr) throw damageErr;

      toast.success("Dano adicionado à vistoria");

      setNewDamage({
        area_name: "",
        damage_type: "",
        description: "",
      });

      qc.invalidateQueries({ queryKey: ["inspection", id] });
      qc.invalidateQueries({ queryKey: ["inspections-list"] });
      qc.invalidateQueries({ queryKey: ["recent-inspections"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (e: any) {
      console.error("[add damage]", e);
      toast.error(e?.message ?? "Erro ao adicionar dano");
    } finally {
      setAddingDamage(false);
    }
  };

  const deleteDamage = async (damage: any) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja apagar este dano da vistoria?",
    );

    if (!confirmed) return;

    setDeletingDamageId(damage.id);

    try {
      const { error } = await supabase
        .from("damages")
        .delete()
        .eq("id", damage.id);

      if (error) throw error;

      toast.success("Dano removido da vistoria");

      qc.invalidateQueries({ queryKey: ["inspection", id] });
      qc.invalidateQueries({ queryKey: ["inspections-list"] });
      qc.invalidateQueries({ queryKey: ["recent-inspections"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (e: any) {
      console.error("[delete damage]", e);
      toast.error(e?.message ?? "Erro ao apagar dano");
    } finally {
      setDeletingDamageId(null);
    }
  };

  if (q.isLoading) {
    return <div className="text-muted-foreground">Carregando vistoria...</div>;
  }

  if (q.isError) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <h1 className="font-display text-xl font-bold text-destructive">
          Erro ao carregar vistoria
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {(q.error as Error)?.message ?? "Erro desconhecido"}
        </p>

        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to="/vistorias">Voltar para vistorias</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!q.data) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <h1 className="font-display text-xl font-bold">
          Vistoria não encontrada
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          A vistoria com ID <span className="font-mono">{id}</span> não foi
          encontrada ou seu usuário não tem permissão para visualizá-la.
        </p>

        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to="/vistorias">Voltar para vistorias</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sig = Array.isArray(q.data.signature)
    ? q.data.signature[0]
    : q.data.signature;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-muted-foreground">
            {q.data.unique_code}
          </div>

          <h1 className="font-display text-2xl font-bold">
            Detalhes da vistoria
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {q.data.status === "finalized" && (
            <Button asChild variant="outline">
              <Link
                to="/laudo/$codigo"
                params={{ codigo: q.data.unique_code }}
                target="_blank"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir laudo público
              </Link>
            </Button>
          )}

          {!editing ? (
            <Button
              type="button"
              onClick={() => setEditing(true)}
              className="bg-gradient-hero"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar vistoria
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={saveChanges}
                disabled={saving}
                className="bg-gradient-hero"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-card">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">
              Dados da vistoria
            </h2>

            <div>
              <Label>Tipo de serviço</Label>
              <Input
                value={form.service_type}
                onChange={(e) =>
                  setForm({ ...form, service_type: e.target.value })
                }
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Cliente</h2>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Nome</Label>
                <Input
                  value={form.client_name}
                  onChange={(e) =>
                    setForm({ ...form, client_name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Telefone</Label>
                <Input
                  value={form.client_phone}
                  onChange={(e) =>
                    setForm({ ...form, client_phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>E-mail</Label>
                <Input
                  value={form.client_email}
                  onChange={(e) =>
                    setForm({ ...form, client_email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>CPF/CNPJ</Label>
                <Input
                  value={form.client_document_number}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      client_document_number: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Veículo</h2>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>Placa</Label>
                <Input
                  value={form.vehicle_plate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      vehicle_plate: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>

              <div>
                <Label>Marca</Label>
                <Input
                  value={form.vehicle_brand}
                  onChange={(e) =>
                    setForm({ ...form, vehicle_brand: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Modelo</Label>
                <Input
                  value={form.vehicle_model}
                  onChange={(e) =>
                    setForm({ ...form, vehicle_model: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Ano</Label>
                <Input
                  value={form.vehicle_year}
                  onChange={(e) =>
                    setForm({ ...form, vehicle_year: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Cor</Label>
                <Input
                  value={form.vehicle_color}
                  onChange={(e) =>
                    setForm({ ...form, vehicle_color: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Quilometragem</Label>
                <Input
                  value={form.vehicle_mileage}
                  onChange={(e) =>
                    setForm({ ...form, vehicle_mileage: e.target.value })
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">
              Observações por peça
            </h2>

            {(q.data.areas ?? []).length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Nenhuma área registrada nesta vistoria.
              </div>
            )}

            <div className="space-y-3">
              {(q.data.areas ?? []).map((area: any) => (
                <div key={area.id} className="rounded-lg border p-3">
                  <Label>{area.area_name}</Label>

                  <Textarea
                    value={areaNotes[area.id] ?? ""}
                    onChange={(e) =>
                      setAreaNotes({
                        ...areaNotes,
                        [area.id]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">
              Adicionar dano esquecido
            </h2>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>Peça/área</Label>

                  <Select
                    value={newDamage.area_name}
                    onValueChange={(value) =>
                      setNewDamage({ ...newDamage, area_name: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>

                    <SelectContent>
                      {VEHICLE_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de dano</Label>

                  <Select
                    value={newDamage.damage_type}
                    onValueChange={(value) =>
                      setNewDamage({ ...newDamage, damage_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>

                    <SelectContent>
                      {DAMAGE_TYPES.map((damage) => (
                        <SelectItem key={damage.value} value={damage.value}>
                          {damage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addDamage}
                    disabled={addingDamage}
                    className="w-full bg-gradient-hero"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {addingDamage ? "Adicionando..." : "Adicionar dano"}
                  </Button>
                </div>
              </div>

              <div className="mt-3">
                <Label>Descrição/observação do dano</Label>

                <Textarea
                  value={newDamage.description}
                  onChange={(e) =>
                    setNewDamage({
                      ...newDamage,
                      description: e.target.value,
                    })
                  }
                  placeholder="Ex: risco profundo no para-choque dianteiro, lado esquerdo"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">
              Danos registrados
            </h2>

            {(q.data.damages ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Nenhum dano registrado nesta vistoria.
              </div>
            ) : (
              <div className="space-y-2">
                {(q.data.damages ?? []).map((damage: any) => {
                  const area = (q.data.areas ?? []).find(
                    (item: any) => item.id === damage.inspection_area_id,
                  );

                  const damageLabel =
                    DAMAGE_TYPES.find(
                      (item) => item.value === damage.damage_type,
                    )?.label ?? damage.damage_type;

                  return (
                    <div
                      key={damage.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
                    >
                      <div>
                        <div className="font-medium">
                          {area?.area_name ?? "Área não identificada"}
                        </div>

                        <div className="mt-1 text-sm text-muted-foreground">
                          {damageLabel}
                        </div>

                        {damage.description && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            {damage.description}
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={deletingDamageId === damage.id}
                        onClick={() => deleteDamage(damage)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {deletingDamageId === damage.id
                          ? "Apagando..."
                          : "Apagar"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        <ReportView inspection={q.data as any} signature={sig} />
      )}
    </div>
  );
}