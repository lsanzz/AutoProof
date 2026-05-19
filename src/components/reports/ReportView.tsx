import { useState } from "react";
import { formatDateTime, buildWhatsAppLink } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Link as LinkIcon,
  ShieldCheck,
  Printer,
  X,
  ZoomIn,
} from "lucide-react";
import { DAMAGE_TYPES } from "@/lib/inspection-areas";
import { toast } from "sonner";

const damageLabel = (v: string) =>
  DAMAGE_TYPES.find((d) => d.value === v)?.label ?? v;

export function ReportView({
  inspection,
  signature,
  publicMode = false,
}: {
  inspection: any;
  signature: any;
  publicMode?: boolean;
}) {
  const ws = inspection.workshop;
  const v = inspection.vehicle;
  const c = inspection.client;
  const photos: any[] = inspection.photos ?? [];
  const damages: any[] = inspection.damages ?? [];
  const areas: any[] = inspection.areas ?? [];
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/laudo/${inspection.unique_code}`;

  const sendWhatsApp = () => {
    if (!c?.phone) return toast.error("Cliente sem telefone cadastrado");

    const msg = `Olá, ${c.name}. Segue o laudo digital da vistoria do veículo ${v?.model ?? ""} - placa ${v?.plate ?? ""}, realizada em ${formatDateTime(inspection.entry_datetime)}. Acesse: ${link}`;

    window.open(buildWhatsAppLink(c.phone, msg), "_blank");
  };

  return (
    <div className="space-y-4">
      {!publicMode && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={sendWhatsApp}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Enviar por WhatsApp
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(link);
              toast.success("Link copiado");
            }}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Copiar link público
          </Button>

          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir / PDF
          </Button>
        </div>
      )}

      <article className="space-y-6 rounded-2xl border bg-card p-6 shadow-card print:border-0 print:shadow-none">
        <header className="flex items-start justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-display font-bold">AutoProof</span>
            </div>

            <h1 className="mt-2 font-display text-2xl font-bold">
              Laudo de Vistoria Digital
            </h1>

            <div className="font-mono text-xs text-muted-foreground">
              Código: {inspection.unique_code}
            </div>
          </div>

          <div className="text-right text-xs text-muted-foreground">
            <div>Entrada: {formatDateTime(inspection.entry_datetime)}</div>
            {inspection.finalized_at && (
              <div>Finalizada: {formatDateTime(inspection.finalized_at)}</div>
            )}
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Section title="Oficina">
            <Field label="Nome" value={ws?.name} />
            <Field label="Documento" value={ws?.document_number} />
            <Field label="Responsável" value={ws?.responsible_name} />
            <Field label="Telefone" value={ws?.phone} />
          </Section>

          <Section title="Cliente">
            <Field label="Nome" value={c?.name} />
            <Field label="Telefone" value={c?.phone} />
            <Field label="Documento" value={c?.document_number} />
          </Section>

          <Section title="Veículo">
            <Field label="Placa" value={v?.plate} />
            <Field
              label="Marca/Modelo"
              value={`${v?.brand ?? ""} ${v?.model ?? ""}`.trim()}
            />
            <Field
              label="Ano/Cor"
              value={`${v?.year ?? "—"} • ${v?.color ?? "—"}`}
            />
            <Field
              label="Quilometragem"
              value={v?.mileage ? `${v.mileage} km` : "—"}
            />
            <Field label="Serviço" value={inspection.service_type} />
          </Section>
        </div>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">
            Resumo dos danos
          </h2>

          {damages.length === 0 ? (
            <div className="rounded-lg bg-success/10 p-3 text-sm text-success">
              Nenhum dano registrado na entrada.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Área</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Observação</th>
                  </tr>
                </thead>

                <tbody>
                  {damages.map((d) => {
                    const area = areas.find(
                      (a) => a.id === d.inspection_area_id,
                    );

                    return (
                      <tr key={d.id} className="border-t">
                        <td className="px-3 py-2">{area?.area_name ?? "—"}</td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                            {damageLabel(d.damage_type)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {d.description ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {areas.some((area) => area.notes && String(area.notes).trim()) && (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">
              Observações por peça
            </h2>

            <div className="space-y-2">
              {areas
                .filter((area) => area.notes && String(area.notes).trim())
                .map((area) => (
                  <div
                    key={area.id}
                    className="rounded-lg border bg-muted/30 p-3 text-sm"
                  >
                    <div className="font-medium">
                      {area.area_name ?? "Área não identificada"}
                    </div>

                    <div className="mt-1 whitespace-pre-wrap text-muted-foreground">
                      {area.notes}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {photos.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">
              Fotos da vistoria
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((p) => {
                const area = areas.find((a) => a.id === p.inspection_area_id);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setSelectedPhoto({
                        ...p,
                        areaName: area?.area_name ?? "—",
                      })
                    }
                    className="group overflow-hidden rounded-lg border bg-muted text-left transition hover:border-primary hover:shadow-md"
                  >
                    <figure>
                      <div className="relative">
                        <img
                          src={p.original_url}
                          alt={area?.area_name ?? "Foto da vistoria"}
                          className="aspect-square w-full object-cover transition group-hover:scale-105"
                        />

                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                          <div className="rounded-full bg-white/90 p-2 text-black shadow">
                            <ZoomIn className="h-5 w-5" />
                          </div>
                        </div>
                      </div>

                      <figcaption className="px-2 py-1 text-[11px] text-muted-foreground">
                        {area?.area_name ?? "—"}
                      </figcaption>
                    </figure>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">
            Dados da vistoria
          </h2>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <div>
              Código único:{" "}
              <strong className="font-mono text-foreground">
                {inspection.unique_code}
              </strong>
            </div>

            <div>
              Status:{" "}
              <strong className="text-foreground">{inspection.status}</strong>
            </div>
          </div>
        </section>

        <footer className="border-t pt-3 text-center text-[11px] text-muted-foreground">
          Documento gerado por AutoProof — autoproof.vercel.app
        </footer>
      </article>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-black shadow hover:bg-white"
            aria-label="Fechar imagem"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="max-h-[90vh] max-w-5xl overflow-hidden rounded-xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.original_url}
              alt={selectedPhoto.areaName ?? "Foto ampliada"}
              className="max-h-[80vh] w-full object-contain"
            />

            <div className="border-t bg-background px-4 py-3 text-sm">
              <div className="font-medium">
                {selectedPhoto.areaName ?? "Foto da vistoria"}
              </div>

              {selectedPhoto.created_at && (
                <div className="text-xs text-muted-foreground">
                  Registrada em {formatDateTime(selectedPhoto.created_at)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>

      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}