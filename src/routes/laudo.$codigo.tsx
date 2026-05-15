import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReportView } from "@/components/reports/ReportView";

export const Route = createFileRoute("/laudo/$codigo")({
  head: ({ params }) => ({ meta: [{ title: `Laudo ${params.codigo} — AutoProof` }] }),
  component: PublicReport,
});

function PublicReport() {
  const { codigo } = Route.useParams();
  const q = useQuery({
    queryKey: ["public-report", codigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspections")
        .select(`*, vehicle:vehicles(*), client:clients(*), workshop:workshops(*),
                 inspector:profiles!inspections_user_id_fkey(name, role),
                 areas:inspection_areas(*),
                 photos(*), damages(*), signature:signatures(*)`)
        .eq("unique_code", codigo)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (q.isLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando laudo...</div>;
  if (!q.data) return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">Laudo não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">O código "{codigo}" não corresponde a nenhum laudo público.</p>
      </div>
    </div>
  );

  const sig = Array.isArray(q.data.signature) ? q.data.signature[0] : q.data.signature;

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="mx-auto max-w-4xl px-4">
        <ReportView inspection={q.data as any} signature={sig} publicMode />
      </div>
    </div>
  );
}
