import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { generateInspectionCode, cn } from "@/lib/utils";
import { SERVICE_TYPES, VEHICLE_AREAS } from "@/lib/inspection-areas";
import { AreaInspector, type AreaState } from "./AreaInspector";
import { SignaturePad } from "./SignaturePad";

const STEPS = ["Cliente", "Veículo", "Serviço", "Vistoria", "Revisão", "Assinatura"];

export function InspectionWizard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [clientId, setClientId] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    name: "",
    phone: "",
    email: "",
    document_number: "",
  });
  const [clientSearch, setClientSearch] = useState("");

  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState({
    plate: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    mileage: "",
  });
  const [plateSearch, setPlateSearch] = useState("");

  const [serviceType, setServiceType] = useState("");

  const [areas, setAreas] = useState<Record<string, AreaState>>(() => {
    const obj: Record<string, AreaState> = {};
    VEHICLE_AREAS.forEach((area) => {
      obj[area] = {
        hasDamage: false,
        notes: "",
        photos: [],
        damages: [],
      };
    });
    return obj;
  });

  const [signerName, setSignerName] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clientResults = useQuery({
    queryKey: ["clients-search", clientSearch],
    enabled: clientSearch.length > 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .or(`name.ilike.%${clientSearch}%,phone.ilike.%${clientSearch}%`)
        .limit(8);

      if (error) throw error;
      return data ?? [];
    },
  });

  const vehicleResults = useQuery({
    queryKey: ["vehicles-search", plateSearch, clientId],
    enabled: plateSearch.length > 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .ilike("plate", `%${plateSearch}%`)
        .limit(8);

      if (error) throw error;
      return data ?? [];
    },
  });

  const next = () => setStep((current) => Math.min(current + 1, STEPS.length - 1));
  const prev = () => setStep((current) => Math.max(current - 1, 0));

  const finalize = async () => {
    if (!user) {
      toast.error("Usuário não autenticado. Faça login novamente.");
      return;
    }

    let workshopId = profile?.workshop_id;

    if (!workshopId) {
      const { data: loadedProfile, error: profileErr } = await supabase
        .from("profiles")
        .select("workshop_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) {
        toast.error(`Erro ao carregar perfil: ${profileErr.message}`);
        return;
      }

      workshopId = loadedProfile?.workshop_id;
    }

    if (!workshopId) {
      toast.error("Perfil da oficina não encontrado.");
      return;
    }

    if (!serviceType) {
      toast.error("Selecione o tipo de serviço.");
      setStep(2);
      return;
    }

    if (!clientId && !newClient.name.trim()) {
      toast.error("Informe ou selecione um cliente.");
      setStep(0);
      return;
    }

    if (!vehicleId && !newVehicle.plate.trim()) {
      toast.error("Informe ou selecione um veículo.");
      setStep(1);
      return;
    }

    if (!signerName.trim()) {
      toast.error("Informe o nome do cliente na assinatura.");
      setStep(5);
      return;
    }

    if (!signatureData) {
      toast.error("Capture a assinatura do cliente.");
      setStep(5);
      return;
    }

    setSubmitting(true);

    try {
      let cId = clientId;

      if (!cId) {
        const { data, error } = await supabase
          .from("clients")
          .insert({
            workshop_id: workshopId,
            name: newClient.name.trim(),
            phone: newClient.phone || null,
            email: newClient.email || null,
            document_number: newClient.document_number || null,
          })
          .select()
          .single();

        if (error) throw error;
        cId = data.id;
      }

      let vId = vehicleId;

      if (!vId) {
        const { data, error } = await supabase
          .from("vehicles")
          .insert({
            workshop_id: workshopId,
            client_id: cId,
            plate: newVehicle.plate.trim().toUpperCase(),
            brand: newVehicle.brand || null,
            model: newVehicle.model || null,
            year: newVehicle.year ? parseInt(newVehicle.year) : null,
            color: newVehicle.color || null,
            mileage: newVehicle.mileage ? parseInt(newVehicle.mileage) : null,
          })
          .select()
          .single();

        if (error) throw error;
        vId = data.id;
      }

      const code = generateInspectionCode();

      const { data: insp, error: inspectionErr } = await supabase
        .from("inspections")
        .insert({
          workshop_id: workshopId,
          client_id: cId,
          vehicle_id: vId,
          user_id: user.id,
          service_type: serviceType,
          status: "draft",
          unique_code: code,
        })
        .select()
        .single();

      if (inspectionErr) throw inspectionErr;
      if (!insp) throw new Error("Falha ao criar vistoria.");

      for (const areaName of Object.keys(areas)) {
        const area = areas[areaName];

        if (!area.hasDamage && area.photos.length === 0 && !area.notes && area.damages.length === 0) {
          continue;
        }

        const { data: areaRow, error: areaErr } = await supabase
          .from("inspection_areas")
          .insert({
            inspection_id: insp.id,
            area_name: areaName,
            has_damage: area.hasDamage,
            notes: area.notes || null,
          })
          .select()
          .single();

        if (areaErr) throw areaErr;
        if (!areaRow) throw new Error(`Falha ao salvar área: ${areaName}`);

        for (const photoUrl of area.photos) {
          const { error: photoErr } = await supabase.from("photos").insert({
            inspection_id: insp.id,
            inspection_area_id: areaRow.id,
            original_url: photoUrl,
          });

          if (photoErr) throw photoErr;
        }

        for (const damage of area.damages) {
          const { error: damageErr } = await supabase.from("damages").insert({
            inspection_id: insp.id,
            inspection_area_id: areaRow.id,
            damage_type: damage.type as any,
            description: damage.description || null,
          });

          if (damageErr) throw damageErr;
        }
      }

      const sigBlob = await (await fetch(signatureData)).blob();
      const sigPath = `${workshopId}/signatures/${insp.id}.png`;

      const { error: uploadErr } = await supabase.storage
        .from("autoproof")
        .upload(sigPath, sigBlob, {
          upsert: true,
          contentType: "image/png",
        });

      if (uploadErr) throw uploadErr;

      const { data: sigPub } = supabase.storage
        .from("autoproof")
        .getPublicUrl(sigPath);

      const { error: signatureErr } = await supabase.from("signatures").insert({
        inspection_id: insp.id,
        client_name: signerName.trim(),
        signature_url: sigPub.publicUrl,
      });

      if (signatureErr) throw signatureErr;

      const { error: finalizeErr } = await supabase
        .from("inspections")
        .update({
          status: "finalized",
          finalized_at: new Date().toISOString(),
        })
        .eq("id", insp.id);

      if (finalizeErr) throw finalizeErr;

      const { error: reportErr } = await supabase.from("reports").insert({
        inspection_id: insp.id,
        workshop_id: workshopId,
        unique_code: code,
        public_url: `${window.location.origin}/laudo/${code}`,
      });

      if (reportErr) throw reportErr;

      toast.success("Vistoria finalizada!");

      navigate({
        to: "/vistorias",
      });
    } catch (e: any) {
      console.error("[finalize inspection]", e);
      toast.error(e?.message ?? "Erro ao finalizar vistoria");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Nova vistoria</h1>
        <p className="text-sm text-muted-foreground">
          Etapa {step + 1} de {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      <div className="flex gap-2">
        {STEPS.map((stepName, index) => (
          <div
            key={stepName}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              index <= step ? "bg-gradient-hero" : "bg-muted"
            )}
          />
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Cliente</h2>

            <Input
              placeholder="Buscar cliente existente..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />

            {(clientResults.data ?? []).map((client: any) => (
              <button
                key={client.id}
                type="button"
                onClick={() => {
                  setClientId(client.id);
                  setClientSearch(client.name);
                  toast.success("Cliente selecionado");
                }}
                className={cn(
                  "w-full rounded-lg border p-3 text-left hover:bg-muted/50",
                  clientId === client.id && "border-primary bg-primary/5"
                )}
              >
                <div className="font-medium">{client.name}</div>
                <div className="text-xs text-muted-foreground">
                  {client.phone} • {client.email}
                </div>
              </button>
            ))}

            <div className="rounded-lg border border-dashed p-4">
              <div className="mb-3 text-sm font-medium">Ou cadastre novo cliente</div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Nome*</Label>
                  <Input
                    value={newClient.name}
                    onChange={(e) => {
                      setNewClient({ ...newClient, name: e.target.value });
                      setClientId(null);
                    }}
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label>E-mail</Label>
                  <Input
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label>CPF/CNPJ</Label>
                  <Input
                    value={newClient.document_number}
                    onChange={(e) =>
                      setNewClient({ ...newClient, document_number: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Veículo</h2>

            <Input
              placeholder="Buscar pela placa..."
              value={plateSearch}
              onChange={(e) => setPlateSearch(e.target.value.toUpperCase())}
            />

            {(vehicleResults.data ?? []).map((vehicle: any) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => {
                  setVehicleId(vehicle.id);
                  setPlateSearch(vehicle.plate);
                }}
                className={cn(
                  "w-full rounded-lg border p-3 text-left hover:bg-muted/50",
                  vehicleId === vehicle.id && "border-primary bg-primary/5"
                )}
              >
                <div className="font-mono font-bold">{vehicle.plate}</div>
                <div className="text-xs text-muted-foreground">
                  {vehicle.brand} {vehicle.model} • {vehicle.year}
                </div>
              </button>
            ))}

            <div className="rounded-lg border border-dashed p-4">
              <div className="mb-3 text-sm font-medium">Ou cadastre novo veículo</div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Placa*</Label>
                  <Input
                    value={newVehicle.plate}
                    onChange={(e) => {
                      setNewVehicle({
                        ...newVehicle,
                        plate: e.target.value.toUpperCase(),
                      });
                      setVehicleId(null);
                    }}
                  />
                </div>

                <div>
                  <Label>Marca</Label>
                  <Input
                    value={newVehicle.brand}
                    onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Modelo</Label>
                  <Input
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Ano</Label>
                  <Input
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Cor</Label>
                  <Input
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Quilometragem</Label>
                  <Input
                    value={newVehicle.mileage}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, mileage: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Tipo de serviço</h2>

            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === 3 && (
          <AreaInspector
            areas={areas}
            onChange={setAreas}
            workshopId={workshopIdFromProfile(profile)}
          />
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Revisão</h2>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <div>
                <strong>Serviço:</strong> {serviceType || "—"}
              </div>

              <div className="mt-2">
                <strong>Áreas com dano:</strong>
              </div>

              <ul className="mt-1 list-inside list-disc space-y-1">
                {Object.entries(areas)
                  .filter(([, area]) => area.hasDamage || area.damages.length > 0)
                  .map(([name, area]) => (
                    <li key={name}>
                      {name} — {area.damages.length} dano(s) registrado(s){" "}
                      {area.notes && (
                        <span className="text-muted-foreground">({area.notes})</span>
                      )}
                    </li>
                  ))}

                {Object.values(areas).every(
                  (area) => !area.hasDamage && area.damages.length === 0
                ) && (
                  <li className="list-none text-muted-foreground">
                    Nenhum dano registrado
                  </li>
                )}
              </ul>

              <div className="mt-2">
                <strong>Fotos:</strong>{" "}
                {Object.values(areas).reduce(
                  (total, area) => total + area.photos.length,
                  0
                )}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">
              Assinatura do cliente
            </h2>

            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              "Declaro estar ciente do estado do veículo no momento da entrada na
              oficina, conforme fotos, observações e checklist registrados nesta
              vistoria digital."
            </div>

            <div>
              <Label>Nome do cliente</Label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
              />
            </div>

            <div>
              <Label>Assine abaixo</Label>
              <SignaturePad onChange={setSignatureData} />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prev} disabled={step === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next} className="bg-gradient-hero">
            Continuar
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              finalize();
            }}
            disabled={submitting}
            className="bg-gradient-hero"
          >
            <Check className="mr-2 h-4 w-4" />
            {submitting ? "Finalizando..." : "Finalizar vistoria"}
          </Button>
        )}
      </div>
    </div>
  );
}

function workshopIdFromProfile(profile: any) {
  return profile?.workshop_id ?? "";
}