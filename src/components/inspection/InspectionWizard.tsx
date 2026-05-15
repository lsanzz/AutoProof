import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  // Cliente
  const [clientId, setClientId] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "", document_number: "" });
  const [clientSearch, setClientSearch] = useState("");

  // Veículo
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState({ plate: "", brand: "", model: "", year: "", color: "", mileage: "" });
  const [plateSearch, setPlateSearch] = useState("");

  // Serviço
  const [serviceType, setServiceType] = useState("");

  // Vistoria
  const [areas, setAreas] = useState<Record<string, AreaState>>(() => {
    const obj: Record<string, AreaState> = {};
    VEHICLE_AREAS.forEach((a) => (obj[a] = { hasDamage: false, notes: "", photos: [], damages: [] }));
    return obj;
  });

  // Assinatura
  const [signerName, setSignerName] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clientResults = useQuery({
    queryKey: ["clients-search", clientSearch],
    enabled: clientSearch.length > 1,
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*")
        .or(`name.ilike.%${clientSearch}%,phone.ilike.%${clientSearch}%`).limit(8);
      return data ?? [];
    },
  });

  const vehicleResults = useQuery({
    queryKey: ["vehicles-search", plateSearch, clientId],
    enabled: plateSearch.length > 1,
    queryFn: async () => {
      const { data } = await supabase.from("vehicles").select("*")
        .ilike("plate", `%${plateSearch}%`).limit(8);
      return data ?? [];
    },
  });

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finalize = async () => {
    if (!profile || !user) return;
    if (!signatureData || !signerName) return toast.error("Capture a assinatura e nome do cliente");
    setSubmitting(true);
    try {
      // Create client if needed
      let cId = clientId;
      if (!cId) {
        if (!newClient.name) throw new Error("Nome do cliente obrigatório");
        const { data, error } = await supabase.from("clients")
          .insert({ ...newClient, workshop_id: profile.workshop_id }).select().single();
        if (error) throw error;
        cId = data.id;
      }
      // Create vehicle if needed
      let vId = vehicleId;
      if (!vId) {
        if (!newVehicle.plate) throw new Error("Placa obrigatória");
        const { data, error } = await supabase.from("vehicles")
          .insert({
            workshop_id: profile.workshop_id, client_id: cId,
            plate: newVehicle.plate.toUpperCase(),
            brand: newVehicle.brand, model: newVehicle.model,
            year: newVehicle.year ? parseInt(newVehicle.year) : null,
            color: newVehicle.color, mileage: newVehicle.mileage ? parseInt(newVehicle.mileage) : null,
          }).select().single();
        if (error) throw error;
        vId = data.id;
      }

      // Create inspection
      const code = generateInspectionCode();
      const { data: insp, error: iErr } = await supabase.from("inspections").insert({
        workshop_id: profile.workshop_id, client_id: cId, vehicle_id: vId,
        user_id: user.id, service_type: serviceType, status: "draft", unique_code: code,
      }).select().single();
      if (iErr) throw iErr;

      // Create areas + photos + damages
      for (const areaName of Object.keys(areas)) {
        const a = areas[areaName];
        if (!a.hasDamage && a.photos.length === 0 && !a.notes) continue;
        const { data: areaRow, error: aErr } = await supabase.from("inspection_areas").insert({
          inspection_id: insp.id, area_name: areaName, has_damage: a.hasDamage, notes: a.notes,
        }).select().single();
        if (aErr) throw aErr;

        for (const photoUrl of a.photos) {
          await supabase.from("photos").insert({
            inspection_id: insp.id, inspection_area_id: areaRow.id, original_url: photoUrl,
          });
        }
        for (const dmg of a.damages) {
          await supabase.from("damages").insert({
            inspection_id: insp.id, inspection_area_id: areaRow.id,
            damage_type: dmg.type as any, description: dmg.description,
          });
        }
      }

      // Upload signature
      const sigBlob = await (await fetch(signatureData)).blob();
      const sigPath = `${profile.workshop_id}/signatures/${insp.id}.png`;
      const { error: upErr } = await supabase.storage.from("autoproof").upload(sigPath, sigBlob, { upsert: true, contentType: "image/png" });
      if (upErr) throw upErr;
      const { data: sigPub } = supabase.storage.from("autoproof").getPublicUrl(sigPath);

      const { error: sErr } = await supabase.from("signatures").insert({
        inspection_id: insp.id, client_name: signerName, signature_url: sigPub.publicUrl,
      });
      if (sErr) throw sErr;

      // Finalize
      await supabase.from("inspections").update({ status: "finalized", finalized_at: new Date().toISOString() }).eq("id", insp.id);

      // Create report record
      await supabase.from("reports").insert({
        inspection_id: insp.id, workshop_id: profile.workshop_id, unique_code: code,
        public_url: `${window.location.origin}/laudo/${code}`,
      });

      toast.success("Vistoria finalizada!");
      navigate({ to: "/vistorias/$id", params: { id: insp.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao finalizar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Nova vistoria</h1>
        <p className="text-sm text-muted-foreground">Etapa {step + 1} de {STEPS.length}: {STEPS[step]}</p>
      </div>

      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-gradient-hero" : "bg-muted")} />
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Cliente</h2>
            <Input placeholder="Buscar cliente existente..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
            {(clientResults.data ?? []).map((c: any) => (
              <button key={c.id} type="button" onClick={() => { setClientId(c.id); setClientSearch(c.name); toast.success("Cliente selecionado"); }}
                className={cn("w-full rounded-lg border p-3 text-left hover:bg-muted/50", clientId === c.id && "border-primary bg-primary/5")}>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.phone} • {c.email}</div>
              </button>
            ))}
            <div className="rounded-lg border border-dashed p-4">
              <div className="mb-3 text-sm font-medium">Ou cadastre novo cliente</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Nome*</Label><Input value={newClient.name} onChange={(e) => { setNewClient({ ...newClient, name: e.target.value }); setClientId(null); }} /></div>
                <div><Label>Telefone</Label><Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} /></div>
                <div><Label>E-mail</Label><Input value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} /></div>
                <div><Label>CPF/CNPJ</Label><Input value={newClient.document_number} onChange={(e) => setNewClient({ ...newClient, document_number: e.target.value })} /></div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Veículo</h2>
            <Input placeholder="Buscar pela placa..." value={plateSearch} onChange={(e) => setPlateSearch(e.target.value.toUpperCase())} />
            {(vehicleResults.data ?? []).map((v: any) => (
              <button key={v.id} type="button" onClick={() => { setVehicleId(v.id); setPlateSearch(v.plate); }}
                className={cn("w-full rounded-lg border p-3 text-left hover:bg-muted/50", vehicleId === v.id && "border-primary bg-primary/5")}>
                <div className="font-mono font-bold">{v.plate}</div>
                <div className="text-xs text-muted-foreground">{v.brand} {v.model} • {v.year}</div>
              </button>
            ))}
            <div className="rounded-lg border border-dashed p-4">
              <div className="mb-3 text-sm font-medium">Ou cadastre novo veículo</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Placa*</Label><Input value={newVehicle.plate} onChange={(e) => { setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() }); setVehicleId(null); }} /></div>
                <div><Label>Marca</Label><Input value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} /></div>
                <div><Label>Modelo</Label><Input value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} /></div>
                <div><Label>Ano</Label><Input value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} /></div>
                <div><Label>Cor</Label><Input value={newVehicle.color} onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })} /></div>
                <div><Label>Quilometragem</Label><Input value={newVehicle.mileage} onChange={(e) => setNewVehicle({ ...newVehicle, mileage: e.target.value })} /></div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Tipo de serviço</h2>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === 3 && (
          <AreaInspector areas={areas} onChange={setAreas} workshopId={profile?.workshop_id ?? ""} />
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Revisão</h2>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <div><strong>Serviço:</strong> {serviceType || "—"}</div>
              <div className="mt-2"><strong>Áreas com dano:</strong></div>
              <ul className="mt-1 list-inside list-disc space-y-1">
                {Object.entries(areas).filter(([, a]) => a.hasDamage || a.damages.length > 0).map(([name, a]) => (
                  <li key={name}>{name} — {a.damages.length} dano(s) registrado(s) {a.notes && <span className="text-muted-foreground">({a.notes})</span>}</li>
                ))}
                {Object.values(areas).every((a) => !a.hasDamage && a.damages.length === 0) && <li className="text-muted-foreground list-none">Nenhum dano registrado</li>}
              </ul>
              <div className="mt-2"><strong>Fotos:</strong> {Object.values(areas).reduce((acc, a) => acc + a.photos.length, 0)}</div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Assinatura do cliente</h2>
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              "Declaro estar ciente do estado do veículo no momento da entrada na oficina, conforme fotos, observações e checklist registrados nesta vistoria digital."
            </div>
            <div><Label>Nome do cliente</Label><Input value={signerName} onChange={(e) => setSignerName(e.target.value)} /></div>
            <div><Label>Assine abaixo</Label><SignaturePad onChange={setSignatureData} /></div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 0}><ChevronLeft className="mr-1 h-4 w-4" /> Voltar</Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} className="bg-gradient-hero">Continuar <ChevronRight className="ml-1 h-4 w-4" /></Button>
        ) : (
          <Button onClick={finalize} disabled={submitting} className="bg-gradient-hero"><Check className="mr-2 h-4 w-4" /> {submitting ? "Finalizando..." : "Finalizar vistoria"}</Button>
        )}
      </div>
    </div>
  );
}
