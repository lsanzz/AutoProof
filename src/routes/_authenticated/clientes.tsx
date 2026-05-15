import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientsPage,
});

function ClientsPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", document_number: "", notes: "" });

  const list = useQuery({
    queryKey: ["clients", q],
    queryFn: async () => {
      let qb = supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (q) qb = qb.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from("clients").insert({ ...form, workshop_id: profile.workshop_id });
    if (error) return toast.error(error.message);
    toast.success("Cliente cadastrado");
    setForm({ name: "", phone: "", email: "", document_number: "", notes: "" });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["clients"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie os clientes da sua oficina</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-hero"><Plus className="mr-2 h-4 w-4" /> Novo cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Nome completo</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>CPF/CNPJ</Label><Input value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} /></div>
              <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full bg-gradient-hero">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar cliente..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(list.data ?? []).map((c: any) => (
          <div key={c.id} className="rounded-xl border bg-card p-4 shadow-card">
            <div className="font-semibold">{c.name}</div>
            {c.document_number && <div className="text-xs text-muted-foreground">{c.document_number}</div>}
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {c.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {c.phone}</div>}
              {c.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {c.email}</div>}
            </div>
          </div>
        ))}
        {list.data?.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhum cliente cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}
