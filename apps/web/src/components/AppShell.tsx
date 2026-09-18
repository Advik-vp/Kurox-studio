import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Clapperboard,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Settings,
  Sparkles,
  Users,
  Wallet,
  Workflow,
  BarChart3,
  FolderKanban,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { api, type Envelope } from "../lib/api";
import { cn } from "../lib/cn";
import { CommandPalette } from "./CommandPalette";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true, perm: "tasks.read" },
  {
    label: "CRM",
    icon: Users,
    perm: "crm.read",
    children: [
      { to: "/app/crm/leads", label: "Leads" },
      { to: "/app/crm/customers", label: "Customers" },
      { to: "/app/crm/contacts", label: "Contacts" },
      { to: "/app/crm/activities", label: "Activities" },
    ],
  },
  {
    label: "Production",
    icon: Clapperboard,
    perm: "projects.read",
    children: [
      { to: "/app/production/projects", label: "Projects" },
      { to: "/app/production/shoots", label: "Shoots" },
      { to: "/app/production/shot-lists", label: "Shot Lists" },
      { to: "/app/production/tasks", label: "Tasks" },
      { to: "/app/production/assets", label: "Assets" },
    ],
  },
  {
    label: "Marketing",
    icon: Megaphone,
    perm: "marketing.read",
    children: [
      { to: "/app/marketing/campaigns", label: "Campaigns" },
      { to: "/app/marketing/ads", label: "Ads" },
      { to: "/app/marketing/analytics", label: "Analytics" },
    ],
  },
  {
    label: "SEO",
    icon: Sparkles,
    perm: "seo.read",
    children: [
      { to: "/app/seo/projects", label: "Projects" },
      { to: "/app/seo/keywords", label: "Keywords" },
      { to: "/app/seo/content", label: "Content" },
      { to: "/app/seo/reports", label: "Reports" },
    ],
  },
  {
    label: "Finance",
    icon: Wallet,
    perm: "quotes.read",
    children: [
      { to: "/app/finance/quotes", label: "Quotes" },
      { to: "/app/finance/invoices", label: "Invoices" },
      { to: "/app/finance/payments", label: "Payments" },
      { to: "/app/finance/expenses", label: "Expenses" },
    ],
  },
  { to: "/app/calendar", label: "Calendar", icon: CalendarDays, perm: "calendar.read" },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, perm: "analytics.read" },
  { to: "/app/automation", label: "Automation", icon: Workflow, perm: "automation.read" },
  { to: "/app/team", label: "Team", icon: FolderKanban, perm: "team.read" },
  { to: "/app/settings", label: "Settings", icon: Settings, perm: "org.write" },
];

export function AppShell() {
  const { session, logout, has, isClient } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const notifs = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api<Envelope<{ id: string; title: string; body: string; created_at: string | null }[]>>("/notifications"),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
      }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 z-30 w-64 border-r border-kx-border bg-kx-elevated/95 backdrop-blur lg:static",
          open ? "flex" : "hidden lg:flex",
          "flex-col",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <div className="font-display text-xl tracking-[0.28em]">KUROX</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-kx-subtle">Studio OS</div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} type="button" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {NAV.filter((item) => !item.perm || has(item.perm) || session?.user.roles.includes("admin")).map((item) => {
            if ("children" in item && item.children) {
              return (
                <div key={item.label} className="pt-3">
                  <div className="mb-1 flex items-center gap-2 px-2 text-[11px] uppercase tracking-wider text-kx-subtle">
                    <item.icon size={14} />
                    {item.label}
                  </div>
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "block rounded-lg px-3 py-1.5 text-sm text-kx-muted hover:bg-kx-hover hover:text-kx-text",
                          isActive && "bg-kx-hover text-kx-text",
                        )
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to!}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-kx-muted hover:bg-kx-hover hover:text-kx-text",
                    isActive && "bg-kx-hover text-kx-text",
                  )
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
          {isClient ? (
            <NavLink to="/client" className="mt-4 block rounded-lg px-3 py-2 text-sm text-kx-accent">
              Client portal
            </NavLink>
          ) : null}
        </nav>
        <div className="border-t border-kx-border p-4 text-xs text-kx-muted">
          <div className="font-medium text-kx-text">{session?.organization?.name}</div>
          <div>
            {session?.user.first_name} {session?.user.last_name}
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-kx-border bg-kx-bg/80 px-4 py-3 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)} type="button" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <button
            className="hidden flex-1 items-center gap-2 rounded-lg border border-kx-border bg-kx-elevated px-3 py-2 text-sm text-kx-subtle sm:flex"
            type="button"
            onClick={() => setPalette(true)}
          >
            <Search size={16} />
            Search customers, projects, shoots…
            <span className="ml-auto font-mono text-[10px]">Ctrl K</span>
          </button>
          <button
            className="relative rounded-lg p-2 text-kx-muted hover:bg-kx-hover"
            type="button"
            aria-label="Notifications"
            onClick={() => setNotesOpen((v) => !v)}
          >
            <Bell size={18} />
            {notifs.data?.data.length ? (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-kx-accent" />
            ) : null}
          </button>
          <button
            className="rounded-lg p-2 text-kx-muted hover:bg-kx-hover"
            type="button"
            aria-label="Sign out"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            <LogOut size={18} />
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      {notesOpen ? (
        <aside className="fixed right-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-80 border-l border-kx-border bg-kx-elevated p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Notifications</h2>
            <button type="button" onClick={() => setNotesOpen(false)} aria-label="Close notifications">
              <X size={16} />
            </button>
          </div>
          <ul className="space-y-3 text-sm">
            {(notifs.data?.data || []).map((n) => (
              <li key={n.id} className="rounded-lg border border-kx-border p-3">
                <div className="font-medium">{n.title}</div>
                <p className="mt-1 text-kx-muted">{n.body}</p>
              </li>
            ))}
            {!notifs.data?.data.length ? <li className="text-kx-muted">No notifications.</li> : null}
          </ul>
        </aside>
      ) : null}
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
