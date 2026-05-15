import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Plus, Trash2, AlertTriangle, Check } from "lucide-react";
import { VEHICLE_AREAS, DAMAGE_TYPES } from "@/lib/inspection-areas";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type AreaState = {
  hasDamage: boolean;
  notes: string;
  photos: string[];
  damages: { type: string; description: string }[];
};

export function AreaInspector({
  areas, onChange, workshopId,
}: {
  areas: Record<string, AreaState>;
  onChange: (a: Record<string, AreaState>) => void;
  workshopId: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  const update = (name: string, patch: Partial<AreaState>) => {
    onChange({ ...areas, [name]: { ...areas[name], ...patch } });
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold">Checklist visual</h2>
      <p className="text-sm text-muted-foreground">Toque em cada área para fotografar e registrar danos.</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {VEHICLE_AREAS.map((name) => {
          const a = areas[name];
          const status = a.damages.length > 0 ? "danger" : a.photos.length > 0 ? "ok" : "empty";
          return (
            <button key={name} type="button" onClick={() => setActive(name)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left shadow-card transition-colors hover:border-primary",
                status === "danger" && "border-destructive/50 bg-destructive/5",
                status === "ok" && "border-success/50 bg-success/5",
              )}>
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium">{name}</span>
                {status === "danger" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                {status === "ok" && <Check className="h-4 w-4 text-success" />}
                {status === "empty" && <Camera className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="text-[11px] text-muted-foreground">{a.photos.length} foto(s) • {a.damages.length} dano(s)</div>
            </button>
          );
        })}
      </div>

      {active && (
        <AreaEditor
          areaName={active}
          state={areas[active]}
          workshopId={workshopId}
          onClose={() => setActive(null)}
          onChange={(patch) => update(active, patch)}
        />
      )}
    </div>
  );
}

function AreaEditor({
  areaName, state, workshopId, onClose, onChange,
}: {
  areaName: string;
  state: AreaState;
  workshopId: string;
  onClose: () => void;
  onChange: (patch: Partial<AreaState>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const path = `${workshopId}/photos/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${file.name}`;
        const { error } = await supabase.storage.from("autoproof").upload(path, file, { contentType: file.type });
        if (error) throw error;
        const { data } = supabase.storage.from("autoproof").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      onChange({ photos: [...state.photos, ...urls] });
      toast.success("Foto(s) adicionada(s)");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const addDamage = () => onChange({ damages: [...state.damages, { type: "risco", description: "" }], hasDamage: true });
  const removeDamage = (i: number) => onChange({ damages: state.damages.filter((_, idx) => idx !== i) });
  const updateDamage = (i: number, patch: Partial<{ type: string; description: string }>) => {
    onChange({ damages: state.damages.map((d, idx) => idx === i ? { ...d, ...patch } : d) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-card p-5 shadow-elegant sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{areaName}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {state.photos.map((u) => (
              <div key={u} className="relative aspect-square overflow-hidden rounded-lg border">
                <img src={u} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => onChange({ photos: state.photos.filter((p) => p !== u) })}
                  className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary">
              <Camera className="h-5 w-5" />
              {uploading ? "Enviando..." : "Adicionar"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </div>

          <div>
            <label className="text-sm font-medium">Observações</label>
            <Textarea value={state.notes} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Ex: arranhão profundo na porta direita" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Danos identificados</label>
              <Button type="button" size="sm" variant="outline" onClick={addDamage}><Plus className="mr-1 h-3 w-3" /> Adicionar dano</Button>
            </div>
            <div className="mt-2 space-y-2">
              {state.damages.map((d, i) => (
                <div key={i} className="flex gap-2 rounded-lg border p-2">
                  <Select value={d.type} onValueChange={(v) => updateDamage(i, { type: v })}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAMAGE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <input
                    className="flex-1 rounded-md border px-3 text-sm"
                    placeholder="Descrição..."
                    value={d.description}
                    onChange={(e) => updateDamage(i, { description: e.target.value })}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeDamage(i)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              {state.damages.length === 0 && <p className="text-xs text-muted-foreground">Nenhum dano registrado nesta área.</p>}
            </div>
          </div>

          <Button onClick={onClose} className="w-full bg-gradient-hero">Concluir área</Button>
        </div>
      </div>
    </div>
  );
}
