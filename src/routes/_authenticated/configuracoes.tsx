import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: SettingsPage,
});

function SettingsPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const ws = useQuery({
    queryKey: ["workshop", profile?.workshop_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase.from("workshops").select("*").eq("id", profile!.workshop_id).single();
      return data;
    },
  });
  const [form, setForm] = useState({ name: "", phone: "", email: "", responsible_name: "", document_number: "" });
  useEffect(() => { if (ws.data) setForm({
    name: ws.data.name ?? "", phone: ws.data.phone ?? "", email: ws.data.email ?? "",
    responsible_name: ws.data.responsible_name ?? "", document_number: ws.data.document_number ?? "",
  }); }, [ws.data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from("workshops").update(form).eq("id", profile.workshop_id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    qc.invalidateQueries({ queryKey: ["workshop"] });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados da oficina</p>
      </div>
      <form onSubmit={save} className="space-y-4 rounded-xl border bg-card p-6 shadow-card">
        <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Documento</Label><Input value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} /></div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Responsável</Label><Input value={form.responsible_name} onChange={(e) => setForm({ ...form, responsible_name: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <Button type="submit" className="bg-gradient-hero">Salvar</Button>
      </form>
    </div>
  );
}
