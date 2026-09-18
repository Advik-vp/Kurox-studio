import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { api, type Envelope } from "../lib/api";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, statusTone } from "../components/ui";
import { NotesPanel } from "../components/NotesPanel";
import { formatMoney } from "../lib/cn";

type Lead = {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  status: string;
  source: string | null;
  estimated_value_minor: number;
};
type Customer = {
  id: string;
  display_name: string;
  company_name: string | null;
  status: string;
  industry: string | null;
  tags: string[];
  contacts: { first_name: string; last_name: string; email: string | null; phone: string | null }[];
};

export function LeadsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ["leads"], queryFn: () => api<Envelope<Lead[]>>("/leads") });
  const create = useMutation({
    mutationFn: (body: object) => api("/leads", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      setOpen(false);
    },
  });
  const convert = useMutation({
    mutationFn: (id: string) => api(`/leads/${id}/convert`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  return (
    <div>
      <PageHeader title="Leads" subtitle="Pipeline: New → Contacted → Qualified → Proposal → Negotiation → Won / Lost" actions={<Button onClick={() => setOpen(true)}>New lead</Button>} />
      {q.isError ? <ErrorBanner message={(q.error as Error).message} onRetry={() => q.refetch()} /> : null}
      {open ? (
        <Card className="mb-4">
          <LeadForm
            pending={create.isPending}
            onCancel={() => setOpen(false)}
            onSubmit={(data) => create.mutate(data)}
          />
        </Card>
      ) : null}
      {!q.data?.data.length && !q.isLoading ? (
        <EmptyState title="No leads yet" hint="Capture an inbound enquiry — a festival film, a retainer, a stills day." action={<Button onClick={() => setOpen(true)}>New lead</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-kx-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-kx-elevated text-xs uppercase tracking-wide text-kx-subtle">
              <tr>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Est. value</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(q.data?.data || []).map((lead) => (
                <tr key={lead.id} className="border-t border-kx-border">
                  <td className="px-4 py-3">{lead.contact_name}</td>
                  <td className="px-4 py-3 text-kx-muted">{lead.company_name}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(lead.status)}>{lead.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-kx-muted">{lead.source}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatMoney(lead.estimated_value_minor)}</td>
                  <td className="px-4 py-3 text-right">
                    {lead.status !== "won" ? (
                      <Button variant="ghost" onClick={() => convert.mutate(lead.id)}>
                        Convert
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeadForm({
  onSubmit,
  onCancel,
  pending,
}: {
  onSubmit: (data: object) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [f, setF] = useState({ contact_name: "", company_name: "", email: "", phone: "", source: "website", service_interest: "commercial" });
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f);
      }}
    >
      <div>
        <Label>Contact name</Label>
        <Input value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })} required />
      </div>
      <div>
        <Label>Company</Label>
        <Input value={f.company_name} onChange={(e) => setF({ ...f, company_name: e.target.value })} />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button disabled={pending} type="submit">
          Save lead
        </Button>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function CustomersPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ["customers"], queryFn: () => api<Envelope<Customer[]>>("/customers") });
  const create = useMutation({
    mutationFn: (body: object) => api<Envelope<Customer>>("/customers", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      nav(`/app/crm/customers/${res.data.id}`);
    },
  });

  return (
    <div>
      <PageHeader title="Customers" subtitle="Studios, brands, and retainers" actions={<Button onClick={() => setOpen(true)}>New customer</Button>} />
      {open ? (
        <Card className="mb-4">
          <CustomerForm pending={create.isPending} onCancel={() => setOpen(false)} onSubmit={(d) => create.mutate(d)} />
        </Card>
      ) : null}
      {q.isError ? <ErrorBanner message={(q.error as Error).message} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {(q.data?.data || []).map((c) => (
          <Link key={c.id} to={`/app/crm/customers/${c.id}`}>
            <Card className="hover:border-kx-accent/40">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{c.display_name}</div>
                  <div className="text-sm text-kx-muted">{c.industry}</div>
                </div>
                <Badge tone={statusTone(c.status)}>{c.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {c.tags?.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CustomerForm({
  onSubmit,
  onCancel,
  pending,
}: {
  onSubmit: (d: object) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [f, setF] = useState({
    display_name: "",
    company_name: "",
    industry: "",
    website: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          display_name: f.display_name,
          company_name: f.company_name,
          industry: f.industry,
          website: f.website,
          primary_contact: { first_name: f.first_name, last_name: f.last_name, email: f.email, phone: f.phone },
        });
      }}
    >
      <div>
        <Label>Display name</Label>
        <Input value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} required />
      </div>
      <div>
        <Label>Company</Label>
        <Input value={f.company_name} onChange={(e) => setF({ ...f, company_name: e.target.value })} />
      </div>
      <div>
        <Label>Primary contact</Label>
        <Input placeholder="First name" value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} required />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button disabled={pending} type="submit">
          Create customer
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const q = useQuery({
    queryKey: ["customer", id],
    queryFn: () => api<Envelope<Customer>>(`/customers/${id}`),
    enabled: Boolean(id),
  });
  const projects = useQuery({
    queryKey: ["projects", id],
    queryFn: () => api<Envelope<{ id: string; name: string; status: string; code: string }[]>>(`/projects?customer_id=${id}`),
    enabled: Boolean(id),
  });
  if (q.isError) return <ErrorBanner message={(q.error as Error).message} />;
  const c = q.data?.data;
  if (!c) return null;
  return (
    <div>
      <PageHeader
        title={c.display_name}
        subtitle={c.company_name || undefined}
        actions={
          <Link to={`/app/production/projects?customer=${c.id}`}>
            <Button>New project</Button>
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-2 text-sm font-medium">Contacts</h2>
          {c.contacts?.map((p, i) => (
            <div key={i} className="text-sm">
              {p.first_name} {p.last_name}
              <div className="text-kx-muted">
                {p.email} · {p.phone}
              </div>
            </div>
          ))}
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-2 text-sm font-medium">Projects</h2>
          <ul className="space-y-2">
            {(projects.data?.data || []).map((p) => (
              <li key={p.id}>
                <Link className="text-sm hover:text-kx-accent" to={`/app/production/projects/${p.id}`}>
                  {p.code} · {p.name}
                </Link>{" "}
                <Badge tone={statusTone(p.status)}>{p.status.replaceAll("_", " ")}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-3">
          <NotesPanel entityType="customer" entityId={c.id} />
        </Card>
      </div>
    </div>
  );
}

export function ContactsPage() {
  const q = useQuery({
    queryKey: ["contacts"],
    queryFn: () =>
      api<
        Envelope<
          {
            id: string;
            first_name: string;
            last_name: string;
            email: string | null;
            phone: string | null;
            customer_id: string;
            customer_name: string | null;
          }[]
        >
      >("/contacts"),
  });
  return (
    <div>
      <PageHeader title="Contacts" subtitle="People at customer companies" />
      {q.isError ? <ErrorBanner message={(q.error as Error).message} onRetry={() => q.refetch()} /> : null}
      {!q.data?.data.length && !q.isLoading ? (
        <EmptyState title="No contacts yet" hint="Contacts are created with customers or when a lead is converted." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-kx-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-kx-elevated text-xs uppercase tracking-wide text-kx-subtle">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
              </tr>
            </thead>
            <tbody>
              {(q.data?.data || []).map((row) => (
                <tr key={row.id} className="border-t border-kx-border">
                  <td className="px-4 py-3">
                    {row.first_name} {row.last_name}
                  </td>
                  <td className="px-4 py-3">
                    <Link className="hover:text-kx-accent" to={`/app/crm/customers/${row.customer_id}`}>
                      {row.customer_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-kx-muted">{row.email}</td>
                  <td className="px-4 py-3 text-kx-muted">{row.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ActivitiesPage() {
  const q = useQuery({
    queryKey: ["activities"],
    queryFn: () =>
      api<Envelope<{ id: string; summary: string; entity_type: string; created_at: string | null }[]>>("/activities"),
  });
  return (
    <div>
      <PageHeader title="Activities" subtitle="Studio-wide CRM and production timeline" />
      {q.isError ? <ErrorBanner message={(q.error as Error).message} onRetry={() => q.refetch()} /> : null}
      <ul className="space-y-2">
        {(q.data?.data || []).map((a) => (
          <li key={a.id} className="rounded-xl border border-kx-border bg-kx-surface px-4 py-3 text-sm">
            <div>{a.summary}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-kx-subtle">
              {a.entity_type} · {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
