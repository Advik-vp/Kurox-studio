import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Envelope } from "../lib/api";
import { useAuth } from "../lib/auth";
import { greeting, formatMoney } from "../lib/cn";
import { Badge, Card, ErrorBanner, Skeleton, statusTone } from "../components/ui";

type Dash = {
  kpis: {
    active_projects: number;
    upcoming_shoots: number;
    open_leads: number;
    revenue_minor: number;
    outstanding_minor: number;
    open_tasks: number;
  };
  pipeline: { status: string; count: number }[];
  tasks: { id: string; title: string; due_at: string | null; priority: string; status: string }[];
  shoots: { id: string; name: string; shoot_date: string | null; location_name: string | null; status: string }[];
  activity: { id: string; summary: string; created_at: string | null }[];
  marketing: { connected: boolean; unavailable_reason: string };
  seo: { connected: boolean; unavailable_reason: string };
};

export function DashboardPage() {
  const { session } = useAuth();
  const q = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<Envelope<Dash>>("/analytics/dashboard"),
  });

  if (q.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }
  if (q.isError) return <ErrorBanner message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  const d = q.data!.data;
  const kpis = [
    ["Active projects", d.kpis.active_projects, "/app/production/projects"],
    ["Upcoming shoots", d.kpis.upcoming_shoots, "/app/production/shoots"],
    ["Open leads", d.kpis.open_leads, "/app/crm/leads"],
    ["Revenue collected", formatMoney(d.kpis.revenue_minor, session?.organization?.currency), "/app/finance/invoices"],
    ["Outstanding", formatMoney(d.kpis.outstanding_minor, session?.organization?.currency), "/app/finance/invoices"],
    ["Open tasks", d.kpis.open_tasks, "/app/production/tasks"],
  ] as const;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-tight">
          {greeting()}, {session?.user.first_name}
        </h1>
        <p className="text-sm text-kx-muted">
          {session?.organization?.name} · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(([label, value, href]) => (
          <Link key={label} to={href}>
            <Card className="hover:border-kx-accent/40">
              <div className="text-xs uppercase tracking-wide text-kx-subtle">{label}</div>
              <div className="mt-2 font-display text-2xl">{value}</div>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <h2 className="mb-3 text-sm font-medium">Project pipeline</h2>
          {d.pipeline.length === 0 ? (
            <p className="text-sm text-kx-muted">No projects yet.</p>
          ) : (
            <ul className="space-y-2">
              {d.pipeline.map((p) => (
                <li key={p.status} className="flex items-center justify-between text-sm">
                  <Badge tone={statusTone(p.status)}>{p.status.replaceAll("_", " ")}</Badge>
                  <span className="font-mono">{p.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-medium">Today’s tasks</h2>
          <ul className="space-y-2">
            {d.tasks.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-2 text-sm">
                <span>{t.title}</span>
                <Badge tone={statusTone(t.status)}>{t.status.replaceAll("_", " ")}</Badge>
              </li>
            ))}
            {d.tasks.length === 0 ? <p className="text-sm text-kx-muted">No open tasks.</p> : null}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-medium">Upcoming shoots</h2>
          <ul className="space-y-3">
            {d.shoots.map((s) => (
              <li key={s.id}>
                <Link to={`/app/production/shoots/${s.id}`} className="text-sm hover:text-kx-accent">
                  {s.name}
                </Link>
                <div className="text-xs text-kx-muted">
                  {s.shoot_date} · {s.location_name}
                </div>
              </li>
            ))}
            {d.shoots.length === 0 ? <p className="text-sm text-kx-muted">No upcoming shoots.</p> : null}
          </ul>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-medium">Recent activity</h2>
          <ul className="space-y-2 text-sm">
            {d.activity.map((a) => (
              <li key={a.id} className="border-b border-kx-border/60 py-2 last:border-0">
                {a.summary}
                <div className="text-xs text-kx-subtle">{a.created_at ? new Date(a.created_at).toLocaleString() : ""}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-medium">Growth modules</h2>
          <p className="text-sm text-kx-muted">{d.marketing.unavailable_reason}</p>
          <p className="mt-2 text-sm text-kx-muted">{d.seo.unavailable_reason}</p>
          <p className="mt-3 text-xs text-kx-subtle">Not mock metrics — adapters are explicitly disconnected.</p>
        </Card>
      </div>
    </div>
  );
}
