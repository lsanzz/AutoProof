import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/convite/$token")({
  head: () => ({ meta: [{ title: "Aceitar convite — AutoProof" }] }),
  component: InviteSignupPage,
});

function InviteSignupPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Informe seu nome.");
      return;
    }

    if (form.password !== form.confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (form.password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);

    const redirectUrl = `${window.location.origin}/dashboard`;

    const { data: signUp, error: signErr } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: form.name.trim(),
        },
      },
    });

    if (signErr) {
      setLoading(false);
      toast.error(signErr.message);
      return;
    }

    if (!signUp.session) {
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (loginErr) {
        setLoading(false);
        toast.error(loginErr.message);
        return;
      }
    }

    const { error: acceptErr } = await (supabase as any).rpc(
      "accept_employee_invite",
      {
        p_token: token,
        p_name: form.name.trim(),
        p_phone: form.phone || null,
      },
    );

    setLoading(false);

    if (acceptErr) {
      toast.error(acceptErr.message);
      return;
    }

    toast.success("Convite aceito! Bem-vindo à oficina.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">AutoProof</span>
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-elegant">
          <h1 className="font-display text-2xl font-bold">
            Aceitar convite
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Crie sua conta para acessar a oficina.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>

            <div>
              <Label>E-mail</Label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>

            <div>
              <Label>Senha</Label>
              <Input
                required
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </div>

            <div>
              <Label>Confirmar senha</Label>
              <Input
                required
                type="password"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-hero">
              {loading ? "Entrando..." : "Aceitar convite"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}