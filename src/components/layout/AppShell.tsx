import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Car, ClipboardCheck, History, UserCog,
  Settings, ShieldCheck, LogOut, Plus, Menu,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vistorias", label: "Vistorias", icon: ClipboardCheck },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/veiculos", label: "Veículos", icon: Car },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/usuarios", label: "Funcionários", icon: UserCog },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
            <ShieldCheck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold">AutoProof</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => {
            const active = path === n.to || (n.to !== "/dashboard" && path.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <div className="rounded-lg bg-sidebar-accent/60 p-3 text-sm">
            <div className="font-medium">{profile?.name ?? "Usuário"}</div>
            <div className="truncate text-xs text-muted-foreground">{profile?.email}</div>
            <div className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
              {profile?.role}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <button onClick={() => setOpen(!open)} className="rounded-md p-2 hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-hero">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">AutoProof</span>
          </div>
          <Button asChild size="sm" className="bg-gradient-hero">
            <Link to="/vistorias/nova"><Plus className="h-4 w-4" /></Link>
          </Button>
        </header>

        {open && (
          <div className="border-b bg-card md:hidden">
            <nav className="space-y-1 p-2">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              ))}
              <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
