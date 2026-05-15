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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspections")
        .select(`*, vehicle:vehicles(*), client:clients(*),
                 workshop:workshops(*),
                 inspector:profiles!inspections_user_id_fkey(name, role),
                 areas:inspection_areas(*),
                 photos(*),
                 damages(*),
                 signature:signatures(*)`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (q.isLoading) return <div className="text-muted-foreground">Carregando...</div>;
  if (!q.data) return <div>Vistoria não encontrada</div>;

  const sig = Array.isArray(q.data.signature) ? q.data.signature[0] : q.data.signature;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-muted-foreground">{q.data.unique_code}</div>
          <h1 className="font-display text-2xl font-bold">Detalhes da vistoria</h1>
        </div>
        {q.data.status === "finalized" && (
          <Button asChild variant="outline">
            <Link to="/laudo/$codigo" params={{ codigo: q.data.unique_code }} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" /> Abrir laudo público
            </Link>
          </Button>
        )}
      </div>
      <ReportView inspection={q.data as any} signature={sig} />
    </div>
  );
}
