import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Phone, Mail, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientsPage,
});

type ClientForm = {
  name: string;
  phone: string;
  email: string;
  document_number: string;
  notes: string;
};

const emptyForm: ClientForm = {
  name: "",
  phone: "",
  email: "",
  document_number: "",
  notes: "",
};

function ClientsPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);

  const list = useQuery({
    queryKey: ["clients", q],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (q) {
        query = query.or(
          `name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`,
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      return data ?? [];
    },
  });

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (client: any) => {
    setEditingClient(client);
    setForm({
      name: client.name ?? "",
      phone: client.phone ?? "",
      email: client.email ?? "",
      document_number: client.document_number ?? "",
      notes: client.notes ?? "",
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) {
      toast.error("Perfil da oficina não carregado.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      document_number: form.document_number || null,
      notes: form.notes || null,
    };

    if (editingClient) {
      const { error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", editingClient.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Cliente atualizado");
    } else {
      const { error } = await supabase.from("clients").insert({
        ...payload,
        workshop_id: profile.workshop_id,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Cliente cadastrado");
    }

    setForm(emptyForm);
    setEditingClient(null);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["clients"] });
  };

  const deleteClient = async (client: any) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja apagar o cliente ${client.name}?\n\nSe ele tiver vistorias vinculadas, o Supabase pode bloquear a exclusão. Primeiro apague as vistorias vinculadas.`,
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Cliente apagado");
    qc.invalidateQueries({ queryKey: ["clients"] });
  };

  const clients = list.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os clientes da sua oficina
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gradient-hero">
              <Plus className="mr-2 h-4 w-4" />
              Novo cliente
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Editar cliente" : "Novo cliente"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label>Nome completo</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>CPF/CNPJ</Label>
                <Input
                  value={form.document_number}
                  onChange={(e) =>
                    setForm({ ...form, document_number: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-hero">
                {editingClient ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          className="pl-9"
          placeholder="Buscar cliente..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client: any) => (
          <div
            key={client.id}
            className="rounded-xl border bg-card p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{client.name}</div>

                {client.document_number && (
                  <div className="text-xs text-muted-foreground">
                    {client.document_number}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  {client.phone}
                </div>
              )}

              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  {client.email}
                </div>
              )}
            </div>

            {client.notes && (
              <div className="mt-3 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                {client.notes}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openEdit(client)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>

              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => deleteClient(client)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Apagar
              </Button>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhum cliente cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}