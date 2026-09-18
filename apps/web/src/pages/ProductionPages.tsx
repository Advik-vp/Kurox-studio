import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { api, type Envelope } from "../lib/api";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, statusTone } from "../components/ui";
import { formatMoney } from "../lib/cn";
import { NotesPanel } from "../components/NotesPanel";

type Project = {
  id: string;
  code: string;
  name: string;
  customer_id: string;
  customer_name: string | null;
  status: string;
  priority: string;
  progress: number;
  budget_minor: number;
  project_type: string;
  start_date: string | null;
  end_date: string | null;
};
type Task = { id: string; title: string; status: string; priority: string; category: string; due_at: string | null };
type Shoot = {
  id: string;
  name: string;
  shoot_date: string | null;
  call_time: string | null;
  location_name: string | null;
  status: string;
  project_name: string | null;
  production_notes: string;
  weather?: Record<string, unknown>;
  shots: { id: string; shot_code: string; description: string; status: string; camera: string | null; lens: string | null }[];
  crew: { id: string; crew_role: string; external_name: string | null }[];
};
type Asset = { id: string; title: string; type: string; status: string };

const STATUSES = ["todo", "in_progress", "review", "completed"];
const PROJECT_STATUSES = [
  "planning",
  "pre_production",
  "production",
  "post_production",
  "review",
  "approved",
  "delivered",
  "completed",
];

export function ProjectsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const customers = useQuery({
    queryKey: ["customers"],
    queryFn: () => api<Envelope<{ id: string; display_name: string }[]>>("/customers"),
  });
  const q = useQuery({ queryKey: ["projects"], queryFn: () => api<Envelope<Project[]>>("/projects") });
  const create = useMutation({
    mutationFn: (body: object) => api("/projects", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
    },
  });

  return (
    <div>
      <PageHeader title="Projects" subtitle="Planning → Pre-Production → Production → Post → Review → Delivery" actions={<Button onClick={() => setOpen(true)}>New project</Button>} />
      {open ? (
        <Card className="mb-4">
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              create.mutate({
                customer_id: fd.get("customer_id"),
                name: fd.get("name"),
                project_type: fd.get("project_type") || "commercial",
                budget_minor: Number(fd.get("budget") || 0) * 100,
              });
            }}
          >
            <div>
              <Label>Customer</Label>
              <select name="customer_id" className="w-full rounded-lg border border-kx-border bg-kx-elevated px-3 py-2 text-sm" required>
                {(customers.data?.data || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Name</Label>
              <Input name="name" required />
            </div>
            <div>
              <Label>Type</Label>
              <Input name="project_type" defaultValue="brand_film" />
            </div>
            <div>
              <Label>Budget (₹)</Label>
              <Input name="budget" type="number" defaultValue={0} />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit">Create</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
      {q.isError ? <ErrorBanner message={(q.error as Error).message} /> : null}
      <div className="overflow-x-auto rounded-xl border border-kx-border">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-kx-elevated text-xs uppercase text-kx-subtle">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Budget</th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.data || []).map((p) => (
              <tr key={p.id} className="border-t border-kx-border">
                <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                <td className="px-4 py-3">
                  <Link className="hover:text-kx-accent" to={`/app/production/projects/${p.id}`}>
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-kx-muted">{p.customer_name}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(p.status)}>{p.status.replaceAll("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="h-1.5 w-24 rounded-full bg-kx-hover">
                    <div className="h-1.5 rounded-full bg-kx-accent" style={{ width: `${p.progress}%` }} />
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{formatMoney(p.budget_minor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["project", id], queryFn: () => api<Envelope<Project>>(`/projects/${id}`), enabled: Boolean(id) });
  const tasks = useQuery({ queryKey: ["tasks", id], queryFn: () => api<Envelope<Task[]>>(`/tasks?project_id=${id}`), enabled: Boolean(id) });
  const shoots = useQuery({ queryKey: ["shoots", id], queryFn: () => api<Envelope<Shoot[]>>(`/shoots?project_id=${id}`), enabled: Boolean(id) });
  const patch = useMutation({
    mutationFn: (status: string) => api(`/projects/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["tasks", id] });
    },
  });
  const p = q.data?.data;
  if (q.isError) return <ErrorBanner message={(q.error as Error).message} />;
  if (!p) return null;
  return (
    <div>
      <PageHeader
        title={p.name}
        subtitle={`${p.code} · ${p.customer_name} · ${p.project_type}`}
        actions={
          <select
            className="rounded-lg border border-kx-border bg-kx-elevated px-3 py-2 text-sm"
            value={p.status}
            onChange={(e) => patch.mutate(e.target.value)}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        }
      />
      <p className="mb-4 text-xs text-kx-subtle">Changing status to Production auto-creates the shoot checklist (automation).</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {PROJECT_STATUSES.map((s) => (
          <span key={s} className={`rounded-full px-2 py-1 text-[11px] ${s === p.status ? "bg-kx-accent text-black" : "bg-kx-hover text-kx-muted"}`}>
            {s.replaceAll("_", " ")}
          </span>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-medium">Tasks</h2>
          <ul className="space-y-2">
            {(tasks.data?.data || []).map((t) => (
              <li key={t.id} className="flex justify-between text-sm">
                {t.title}
                <Badge tone={statusTone(t.status)}>{t.status.replaceAll("_", " ")}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-medium">Shoots</h2>
          {(shoots.data?.data || []).map((s) => (
            <Link key={s.id} to={`/app/production/shoots/${s.id}`} className="mb-2 block text-sm hover:text-kx-accent">
              {s.name} · {s.shoot_date}
            </Link>
          ))}
        </Card>
        <Card className="lg:col-span-2">
          {id ? <NotesPanel entityType="project" entityId={id} /> : null}
        </Card>
      </div>
    </div>
  );
}

export function ShootsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => api<Envelope<Project[]>>("/projects") });
  const q = useQuery({ queryKey: ["shoots"], queryFn: () => api<Envelope<Shoot[]>>("/shoots") });
  const create = useMutation({
    mutationFn: (body: object) => api("/shoots", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shoots"] });
      setOpen(false);
    },
  });
  return (
    <div>
      <PageHeader title="Shoots" subtitle="Call sheets, crew, locations, shot lists" actions={<Button onClick={() => setOpen(true)}>New shoot</Button>} />
      {open ? (
        <Card className="mb-4">
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              create.mutate({
                project_id: fd.get("project_id"),
                name: fd.get("name"),
                shoot_date: fd.get("shoot_date"),
                call_time: fd.get("call_time") || null,
                location_name: fd.get("location_name"),
                shots: [{ description: "Master wide", camera: "Alexa Mini", lens: "35mm" }],
              });
            }}
          >
            <div>
              <Label>Project</Label>
              <select name="project_id" className="w-full rounded-lg border border-kx-border bg-kx-elevated px-3 py-2 text-sm" required>
                {(projects.data?.data || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Name</Label>
              <Input name="name" required />
            </div>
            <div>
              <Label>Date</Label>
              <Input name="shoot_date" type="date" />
            </div>
            <div>
              <Label>Call time</Label>
              <Input name="call_time" type="time" />
            </div>
            <div className="md:col-span-2">
              <Label>Location</Label>
              <Input name="location_name" />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create shoot</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {(q.data?.data || []).map((s) => (
          <Link key={s.id} to={`/app/production/shoots/${s.id}`}>
            <Card className="hover:border-kx-shoot/50">
              <div className="flex justify-between">
                <div className="font-medium">{s.name}</div>
                <Badge tone={statusTone(s.status)}>{s.status}</Badge>
              </div>
              <div className="mt-2 text-sm text-kx-muted">
                {s.shoot_date} · call {s.call_time || "TBD"} · {s.location_name}
              </div>
              <div className="mt-1 text-xs text-kx-subtle">{s.project_name}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ShootDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["shoot", id], queryFn: () => api<Envelope<Shoot>>(`/shoots/${id}`), enabled: Boolean(id) });
  const patchShot = useMutation({
    mutationFn: ({ shotId, status }: { shotId: string; status: string }) =>
      api(`/shots/${shotId}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shoot", id] }),
  });
  const s = q.data?.data;
  if (!s) return q.isError ? <ErrorBanner message={(q.error as Error).message} /> : null;
  return (
    <div>
      <PageHeader title={s.name} subtitle={`${s.shoot_date} · Call ${s.call_time} · ${s.location_name}`} />
      <Card className="mb-4">
        <div className="text-xs uppercase text-kx-subtle">Weather</div>
        <p className="text-sm text-kx-muted">{s.weather ? JSON.stringify(s.weather) : "Weather adapter is NoOp until a provider is configured."}</p>
      </Card>
      <Card>
        <h2 className="mb-3 text-sm font-medium">Shot list</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-kx-subtle">
              <tr>
                <th className="py-2">ID</th>
                <th>Description</th>
                <th>Camera</th>
                <th>Lens</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {s.shots.map((sh) => (
                <tr key={sh.id} className="border-t border-kx-border">
                  <td className="py-2 font-mono text-xs">{sh.shot_code}</td>
                  <td>{sh.description}</td>
                  <td>{sh.camera}</td>
                  <td>{sh.lens}</td>
                  <td>
                    <select
                      className="rounded border border-kx-border bg-kx-elevated px-2 py-1 text-xs"
                      value={sh.status}
                      onChange={(e) => patchShot.mutate({ shotId: sh.id, status: e.target.value })}
                    >
                      {["planned", "ready", "shot", "retake", "approved"].map((st) => (
                        <option key={st}>{st}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function TasksPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["tasks"], queryFn: () => api<Envelope<Task[]>>("/tasks") });
  const patch = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const grouped = STATUSES.map((st) => ({
    st,
    items: (q.data?.data || []).filter((t) => t.status === st),
  }));
  return (
    <div>
      <PageHeader title="Tasks" subtitle="Kanban · Todo → In Progress → Review → Completed" />
      <div className="grid gap-3 md:grid-cols-4">
        {grouped.map((col) => (
          <div key={col.st} className="rounded-xl border border-kx-border bg-kx-elevated/50 p-3">
            <div className="mb-3 text-xs uppercase tracking-wide text-kx-subtle">
              {col.st.replaceAll("_", " ")} · {col.items.length}
            </div>
            <div className="space-y-2">
              {col.items.map((t) => (
                <Card key={t.id} className="p-3">
                  <div className="text-sm">{t.title}</div>
                  <div className="mt-2 flex justify-between text-[11px] text-kx-subtle">
                    <span>{t.category}</span>
                    <select
                      className="bg-transparent"
                      value={t.status}
                      onChange={(e) => patch.mutate({ id: t.id, status: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AssetsPage() {
  const q = useQuery({ queryKey: ["assets"], queryFn: () => api<Envelope<Asset[]>>("/assets") });
  return (
    <div>
      <PageHeader title="Assets" subtitle="Object storage pipeline — files live outside Postgres" />
      {!q.data?.data.length ? (
        <EmptyState title="No assets yet" hint="Uploads use a storage port (local/S3/R2). Presign flow is implemented; UI dropzone is Phase 2 polish." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.data.map((a) => (
            <Card key={a.id}>
              <div className="font-medium">{a.title}</div>
              <div className="mt-2 flex gap-2">
                <Badge>{a.type}</Badge>
                <Badge tone={statusTone(a.status)}>{a.status.replaceAll("_", " ")}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function ShotListsPage() {
  const q = useQuery({ queryKey: ["shoots"], queryFn: () => api<Envelope<Shoot[]>>("/shoots") });
  return (
    <div>
      <PageHeader title="Shot lists" subtitle="Every shoot’s planned → ready → shot → retake → approved" />
      {(q.data?.data || []).map((s) => (
        <Card key={s.id} className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <Link className="font-medium hover:text-kx-accent" to={`/app/production/shoots/${s.id}`}>
              {s.name}
            </Link>
            <Badge tone={statusTone(s.status)}>{s.status}</Badge>
          </div>
          <p className="text-xs text-kx-muted">
            {(s.shots || []).length} shots · {s.shoot_date} · {s.location_name}
          </p>
        </Card>
      ))}
    </div>
  );
}
