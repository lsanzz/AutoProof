import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReportView } from "@/components/reports/ReportView";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vistorias/$id")({
  component: InspectionDetail,
});

function InspectionDetail() {
  const { id } = Route.useParams();

  const q = useQuery({
    queryKey: ["inspection", id],
    enabled: !!id,
    retry: 1,
    queryFn: async () => {
      console.log("[InspectionDetail] buscando vistoria:", id);

      const { data, error } = await supabase
        .from("inspections")
        .select(`
  *,
  vehicle:vehicles(*),
  client:clients(*),
  workshop:workshops(*),
  areas:inspection_areas(*),
  photos(*),
  damages(*),
  signature:signatures(*)
`)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("[InspectionDetail] erro Supabase:", error);
        throw error;
      }

      console.log("[InspectionDetail] resultado:", data);
      return data;
    },
  });

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
        <h1 className="font-display text-xl font-bold">Vistoria não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A vistoria com ID <span className="font-mono">{id}</span> não foi encontrada ou
          seu usuário não tem permissão para visualizá-la.
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
      </div>

      <ReportView inspection={q.data as any} signature={sig} />
    </div>
  );
}