import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Camera, FileSignature, FileText, Smartphone,
  History, Users, Workflow, Check, MessageCircle, Car,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoProof — Prova digital para proteger sua oficina" },
      { name: "description", content: "Vistoria digital com fotos, checklist, marcação de danos e assinatura. Evite reclamações indevidas e gere laudos profissionais." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-card">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">AutoProof</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#beneficios" className="text-muted-foreground hover:text-foreground">Benefícios</a>
            <a href="#como-funciona" className="text-muted-foreground hover:text-foreground">Como funciona</a>
            <a href="#planos" className="text-muted-foreground hover:text-foreground">Planos</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Entrar</Link></Button>
            <Button asChild size="sm" className="bg-gradient-hero shadow-card"><Link to="/cadastro">Começar agora</Link></Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Proteção jurídica para sua oficina
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Proteja sua oficina contra reclamações <span className="bg-gradient-hero bg-clip-text text-transparent">indevidas</span> sobre danos em veículos
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Registre fotos, checklist, observações e assinatura digital do cliente antes de iniciar o serviço. Gere laudos profissionais e tenha provas organizadas em nuvem.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-hero shadow-elegant">
                <Link to="/cadastro">Começar agora <Check className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#como-funciona">Ver demonstração</a>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Sem cartão de crédito</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Funciona no celular</div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border bg-card p-6 shadow-elegant">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Laudo de vistoria</div>
                  <div className="font-display text-lg font-semibold">AP-2026-9F2X4D</div>
                </div>
                <div className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Assinado</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Veículo</div>
                  <div className="font-semibold">Civic 2022 — ABC1D23</div>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Cliente</div>
                  <div className="font-semibold">Marina Silva</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Frente","Lateral E","Traseira","Capô","Rodas","Interior"].map((l, i) => (
                  <div key={l} className="aspect-square rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 p-2 text-[10px] text-primary flex flex-col justify-end">
                    <Camera className="h-3.5 w-3.5 mb-1" />
                    {l}
                    {i === 1 && <span className="mt-1 inline-block w-fit rounded bg-destructive px-1 text-[9px] text-destructive-foreground">Risco</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
                <FileSignature className="h-4 w-4" />
                Assinado pelo cliente em 14/05/2026 09:32
              </div>
            </div>
            <div className="absolute -right-4 -top-4 hidden rotate-3 rounded-xl bg-card px-3 py-2 shadow-card md:block">
              <div className="flex items-center gap-2 text-xs font-medium"><MessageCircle className="h-3.5 w-3.5 text-primary" />Enviado por WhatsApp</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">O cliente diz que o risco foi feito na sua oficina. E agora?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Toda oficina já passou por isso. Sem prova do estado real do veículo na entrada, a discussão vira sua palavra contra a do cliente — e geralmente sai caro.
          </p>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Como funciona</h2>
          <p className="mt-3 text-muted-foreground">Em menos de 3 minutos você tem uma vistoria completa e assinada.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {[
            { icon: Car, title: "1. Cadastre cliente e veículo", desc: "Busque pela placa ou cadastre rapidamente." },
            { icon: Camera, title: "2. Fotografe as áreas", desc: "Checklist visual com 14 áreas do veículo." },
            { icon: FileSignature, title: "3. Cliente assina", desc: "Assinatura digital direto no celular ou tablet." },
            { icon: FileText, title: "4. Laudo gerado", desc: "Link único para enviar por WhatsApp." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section id="beneficios" className="bg-gradient-subtle">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Benefícios para sua oficina</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Evita acusações injustas" },
              { icon: FileText, title: "Gera laudo profissional" },
              { icon: MessageCircle, title: "Envio por WhatsApp" },
              { icon: History, title: "Histórico por placa" },
              { icon: FileSignature, title: "Assinatura do cliente" },
              { icon: Smartphone, title: "Funciona no celular" },
              { icon: Users, title: "Funcionários por permissão" },
              { icon: Workflow, title: "Mais profissionalismo" },
            ].map(({ icon: Icon, title }) => (
              <div key={title} className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="font-medium">{title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARA QUEM */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Para quem serve</h2>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {["Oficinas mecânicas","Funilarias","Estéticas automotivas","Lava-rápidos","Martelinho de ouro","Concessionárias","Locadoras","Empresas de frota"].map((t) => (
            <span key={t} className="rounded-full border bg-card px-4 py-2 text-sm shadow-card">{t}</span>
          ))}
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="bg-gradient-subtle">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Planos</h2>
            <p className="mt-3 text-muted-foreground">Comece grátis. Sem cartão de crédito.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: "Básico", price: "Grátis", items: ["1 usuário","Até 50 vistorias/mês","Histórico básico","Marca AutoProof no laudo"] },
              { name: "Profissional", price: "R$ 89/mês", items: ["Até 5 usuários","Vistorias ilimitadas","Logo da oficina no laudo","Envio por WhatsApp"], featured: true },
              { name: "Premium", price: "R$ 199/mês", items: ["Usuários ilimitados","Checklist personalizado","Relatórios avançados","API e suporte prioritário"] },
            ].map((p) => (
              <div key={p.name} className={`rounded-2xl border p-6 ${p.featured ? "bg-gradient-hero text-primary-foreground shadow-elegant" : "bg-card shadow-card"}`}>
                <div className="font-display text-lg font-semibold">{p.name}</div>
                <div className="mt-2 font-display text-3xl font-bold">{p.price}</div>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.items.map((i) => (
                    <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4" /> {i}</li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" variant={p.featured ? "secondary" : "default"}>
                  <Link to="/cadastro">Começar</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-center font-display text-3xl font-bold md:text-4xl">Perguntas frequentes</h2>
        <div className="mt-10 space-y-4">
          {[
            { q: "O laudo tem valor jurídico?", a: "Sim. Combina assinatura digital, registro de data/hora e link público auditável, formando um conjunto probatório robusto." },
            { q: "Funciona offline?", a: "Você precisa de internet para sincronizar, mas o app é leve e roda bem em qualquer celular moderno." },
            { q: "Posso cadastrar vários funcionários?", a: "Sim, com permissões diferentes (admin, atendente, mecânico, vistoriador)." },
            { q: "Os clientes precisam baixar app?", a: "Não. A assinatura é feita direto na tela do seu celular ou tablet." },
          ].map((f) => (
            <div key={f.q} className="rounded-xl border bg-card p-5 shadow-card">
              <div className="font-semibold">{f.q}</div>
              <div className="mt-2 text-sm text-muted-foreground">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center text-primary-foreground">
          <h2 className="font-display text-3xl font-bold md:text-5xl">Comece a proteger sua oficina hoje.</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">Crie sua conta em menos de 1 minuto e faça sua primeira vistoria agora.</p>
          <Button asChild size="lg" variant="secondary" className="mt-8 shadow-elegant">
            <Link to="/cadastro">Cadastrar minha oficina</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-hero">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">AutoProof</span>
            <span className="text-sm text-muted-foreground">— Prova digital para proteger sua oficina.</span>
          </div>
          <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} AutoProof</div>
        </div>
      </footer>
    </div>
  );
}
