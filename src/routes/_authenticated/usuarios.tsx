import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { createFileRoute } from "@tanstack/react-router";
import { UserRoundCog } from "lucide-react";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: UsersPage,
});

function UsersPage() {
  const { profile } = useAuth();
  const list = useQuery({
    queryKey: ["users", profile?.workshop_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at");
      return data ?? [];
    },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Funcionários</h1>
        <p className="text-sm text-muted-foreground">Equipe da sua oficina</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(list.data ?? []).map((u: any) => (
          <div key={u.id} className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRoundCog className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
            </div>
            <div className="mt-3 inline-block rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">{u.role}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Para adicionar novos funcionários, peça que eles criem uma conta e depois associe-os à oficina (em breve).</p>
    </div>
  );
}
