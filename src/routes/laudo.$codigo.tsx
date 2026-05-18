import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReportView } from "@/components/reports/ReportView";

type PublicReportData = {
  id: string;
  unique_code: string;
  signature?: any;
  [key: string]: any;
};

export const Route = createFileRoute("/laudo/$codigo")({
  head: ({ params }) => ({
    meta: [{ title: `Laudo ${params.codigo} — AutoProof` }],
  }),
  component: PublicReport,
});

function PublicReport() {
  const { codigo } = Route.useParams();

  const q = useQuery<PublicReportData | null>({
    queryKey: ["public-report", codigo],
    enabled: Boolean(codigo),
    retry: 1,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_public_report", {
        p_code: codigo,
      });

      if (error) {
        console.error("[public report error]", error);
        throw error;
      }

      return (data ?? null) as PublicReportData | null;
    },
  });

  if (q.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando laudo...
      </div>
    );
  }

  if (q.isError) {
    const message =
      q.error instanceof Error ? q.error.message : "Erro desconhecido";

    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-destructive">
            Erro ao carregar laudo
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  if (!q.data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Laudo não encontrado
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            O código "{codigo}" não corresponde a nenhum laudo público finalizado.
          </p>
        </div>
      </div>
    );
  }

  const signature = Array.isArray(q.data.signature)
    ? q.data.signature[0]
    : q.data.signature;

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="mx-auto max-w-4xl px-4">
        <ReportView inspection={q.data} signature={signature} publicMode />
      </div>
    </div>
  );
}