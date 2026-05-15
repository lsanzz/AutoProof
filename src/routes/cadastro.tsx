import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastrar oficina — AutoProof" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    workshopName: "", documentType: "cnpj", documentNumber: "",
    responsibleName: "", phone: "", email: "", password: "", confirm: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("As senhas não coincidem");
    if (form.password.length < 8) return toast.error("Senha mínima de 8 caracteres");
    setLoading(true);

    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data: signUp, error: signErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: redirectUrl, data: { name: form.responsibleName } },
    });
    if (signErr) { setLoading(false); return toast.error(signErr.message); }

    // Sign in if needed (auto-confirm enabled)
    if (!signUp.session) {
      const { error: siErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (siErr) { setLoading(false); return toast.error(siErr.message); }
    }

    const { data: ws, error: wsErr } = await supabase
      .from("workshops")
      .insert({
        name: form.workshopName,
        document_type: form.documentType,
        document_number: form.documentNumber || null,
        responsible_name: form.responsibleName,
        phone: form.phone,
        email: form.email,
      })
      .select()
      .single();
    if (wsErr || !ws) { setLoading(false); return toast.error(wsErr?.message ?? "Falha ao criar oficina"); }

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) { setLoading(false); return toast.error("Sessão não encontrada"); }

    const { error: pErr } = await supabase.from("profiles").insert({
      id: uid,
      workshop_id: ws.id,
      name: form.responsibleName,
      email: form.email,
      phone: form.phone,
      role: "admin",
    });
    if (pErr) { setLoading(false); return toast.error(pErr.message); }

    setLoading(false);
    toast.success("Oficina cadastrada com sucesso!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">AutoProof</span>
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-elegant">
          <h1 className="font-display text-2xl font-bold">Cadastre sua oficina</h1>
          <p className="mt-1 text-sm text-muted-foreground">Comece grátis. Você poderá adicionar funcionários depois.</p>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <Label>Nome da empresa</Label>
              <Input required value={form.workshopName} onChange={(e) => set("workshopName", e.target.value)} />
            </div>

            <div>
              <Label>Tipo de documento</Label>
              <RadioGroup value={form.documentType} onValueChange={(v) => set("documentType", v)} className="mt-2 flex gap-4">
                <label className="flex items-center gap-2"><RadioGroupItem value="cnpj" /> CNPJ</label>
                <label className="flex items-center gap-2"><RadioGroupItem value="cpf" /> CPF</label>
              </RadioGroup>
            </div>

            <div>
              <Label>{form.documentType === "cnpj" ? "CNPJ" : "CPF"}</Label>
              <Input value={form.documentNumber} onChange={(e) => set("documentNumber", e.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nome do responsável</Label>
                <Input required value={form.responsibleName} onChange={(e) => set("responsibleName", e.target.value)} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div>
              <Label>E-mail</Label>
              <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Senha</Label>
                <Input required type="password" value={form.password} onChange={(e) => set("password", e.target.value)} />
              </div>
              <div>
                <Label>Confirmar senha</Label>
                <Input required type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-hero">
              {loading ? "Criando..." : "Criar oficina"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
