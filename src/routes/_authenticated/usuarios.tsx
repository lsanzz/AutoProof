import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { createFileRoute } from "@tanstack/react-router";
import { UserRoundCog, Plus, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: UsersPage,
});

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "Administrador",
    attendant: "Atendente",
    mechanic: "Mecânico",
    inspector: "Vistoriador",
  };

  return labels[role] ?? role;
}

function UsersPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("inspector");
  const [lastInviteLink, setLastInviteLink] = useState("");
  const [loading, setLoading] = useState(false);

  const users = useQuery({
    queryKey: ["users", profile?.workshop_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("workshop_id", profile!.workshop_id)
        .order("created_at");

      if (error) throw error;

      return data ?? [];
    },
  });

  const invites = useQuery({
    queryKey: ["employee-invites", profile?.workshop_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_invites")
        .select("*")
        .eq("workshop_id", profile!.workshop_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data ?? [];
    },
  });

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.workshop_id) {
      toast.error("Oficina não carregada.");
      return;
    }

    if (profile.role !== "admin") {
      toast.error("Apenas administradores podem convidar funcionários.");
      return;
    }

    if (!inviteEmail.trim()) {
      toast.error("Informe o e-mail do funcionário.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("employee_invites")
      .insert({
        workshop_id: profile.workshop_id,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole as any,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const link = `${window.location.origin}/convite/${data.token}`;

    setLastInviteLink(link);
    setInviteEmail("");
    setInviteRole("inspector");

    await navigator.clipboard.writeText(link).catch(() => null);

    toast.success("Convite criado e link copiado!");
    qc.invalidateQueries({ queryKey: ["employee-invites"] });
  };

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/convite/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Funcionários</h1>
          <p className="text-sm text-muted-foreground">
            Equipe vinculada à sua oficina
          </p>
        </div>

        {profile?.role === "admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-hero">
                <Plus className="mr-2 h-4 w-4" />
                Convidar funcionário
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar funcionário</DialogTitle>
              </DialogHeader>

              <form onSubmit={createInvite} className="space-y-4">
                <div>
                  <Label>E-mail do funcionário</Label>
                  <Input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="funcionario@email.com"
                  />
                </div>

                <div>
                  <Label>Função</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspector">Vistoriador</SelectItem>
                      <SelectItem value="mechanic">Mecânico</SelectItem>
                      <SelectItem value="attendant">Atendente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-hero"
                >
                  {loading ? "Criando..." : "Criar convite"}
                </Button>
              </form>

              {lastInviteLink && (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <div className="font-medium">Link do convite:</div>
                  <div className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {lastInviteLink}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      navigator.clipboard.writeText(lastInviteLink);
                      toast.success("Link copiado!");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar link
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">
          Funcionários ativos
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(users.data ?? []).map((u: any) => (
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

              <div className="mt-3 inline-block rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">
                {roleLabel(u.role)}
              </div>
            </div>
          ))}

          {users.data?.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum funcionário cadastrado.
            </div>
          )}
        </div>
      </div>

      {profile?.role === "admin" && (
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold">
            Convites enviados
          </h2>

          <div className="space-y-2">
            {(invites.data ?? []).map((invite: any) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{invite.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {roleLabel(invite.role)} • {invite.status}
                  </div>
                </div>

                {invite.status === "pending" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(invite.token)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar link
                  </Button>
                )}
              </div>
            ))}

            {invites.data?.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nenhum convite enviado ainda.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}