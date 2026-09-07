import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  CheckSquare,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  StickyNote,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApplicationDialog } from "@/components/application-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { to: "/applications", label: "Candidaturas", icon: Briefcase },
  { to: "/companies", label: "Empresas", icon: Building2 },
  { to: "/calendar", label: "Calendario", icon: CalendarDays },
  { to: "/tasks", label: "Tareas", icon: CheckSquare },
  { to: "/notes", label: "Notas", icon: StickyNote },
  { to: "/vault", label: "CV Vault", icon: FileText },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Ajustes", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const email = user?.email ?? "";
  const displayName = email.split("@")[0] ?? "Cuenta";

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3">
      {NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className={cn("size-4", active ? "text-sidebar-primary" : "opacity-70")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">
          N
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">NextRound</p>
          <p className="text-[11px] text-sidebar-foreground/55">Job search OS</p>
        </div>
      </div>

      <div className="px-3 pb-4">
        <Button
          onClick={() => {
            setNewOpen(true);
            setMobileOpen(false);
          }}
          className="w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
        >
          <Plus className="size-4" />
          Nueva candidatura
        </Button>
      </div>

      {nav}

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">
            {displayName.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{displayName}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/55">{email}</p>
          </div>
          <button
            onClick={signOut}
            aria-label="Cerrar sesión"
            className="rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border lg:block">
        {sidebarInner}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-foreground/40"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72">
            {sidebarInner}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1.5 text-sidebar-foreground/70"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="rounded-md border border-border p-2"
          >
            <Menu className="size-4" />
          </button>
          <span className="font-display text-sm font-semibold">NextRound</span>
          <Button size="sm" className="ml-auto gap-1.5" onClick={() => setNewOpen(true)}>
            <Plus className="size-3.5" />
            Nueva
          </Button>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-5 py-7 md:px-8 md:py-9">{children}</main>
      </div>

      <ApplicationDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
