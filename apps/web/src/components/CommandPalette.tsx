import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, type Envelope } from "../lib/api";
import { cn } from "../lib/cn";

type Hit = { href: string; label: string; hint: string };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const customers = useQuery({
    queryKey: ["customers"],
    queryFn: () => api<Envelope<{ id: string; display_name: string }[]>>("/customers"),
    enabled: open,
  });
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<Envelope<{ id: string; name: string; code: string }[]>>("/projects"),
    enabled: open,
  });

  const actions: Hit[] = useMemo(
    () => [
      { href: "/app/crm/leads", label: "New lead", hint: "CRM" },
      { href: "/app/crm/customers", label: "Customers", hint: "CRM" },
      { href: "/app/production/projects", label: "Projects", hint: "Production" },
      { href: "/app/production/shoots", label: "Shoots", hint: "Production" },
      { href: "/app/production/tasks", label: "Tasks", hint: "Production" },
      { href: "/app/finance/quotes/new", label: "New quote", hint: "Finance" },
      { href: "/app/calendar", label: "Calendar", hint: "Ops" },
    ],
    [],
  );

  const hits = useMemo(() => {
    const term = q.trim().toLowerCase();
    const fromData: Hit[] = [
      ...(customers.data?.data || []).map((c) => ({
        href: `/app/crm/customers/${c.id}`,
        label: c.display_name,
        hint: "Customer",
      })),
      ...(projects.data?.data || []).map((p) => ({
        href: `/app/production/projects/${p.id}`,
        label: `${p.code} ${p.name}`,
        hint: "Project",
      })),
      ...actions,
    ];
    if (!term) return fromData.slice(0, 12);
    return fromData.filter((h) => h.label.toLowerCase().includes(term) || h.hint.toLowerCase().includes(term)).slice(0, 12);
  }, [q, customers.data, projects.data, actions]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <button className="absolute inset-0 cursor-default" aria-label="Close search" onClick={onClose} type="button" />
      <div className="relative w-full max-w-xl rounded-xl border border-kx-border bg-kx-surface shadow-kx">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers, projects, or jump…"
          className="w-full border-b border-kx-border bg-transparent px-4 py-3 text-sm outline-none"
        />
        <ul className="max-h-80 overflow-y-auto py-2">
          {hits.map((h) => (
            <li key={h.href + h.label}>
              <button
                type="button"
                className={cn("flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-kx-hover")}
                onClick={() => {
                  navigate(h.href);
                  onClose();
                }}
              >
                <span>{h.label}</span>
                <span className="text-[11px] uppercase tracking-wide text-kx-subtle">{h.hint}</span>
              </button>
            </li>
          ))}
          {hits.length === 0 ? <li className="px-4 py-6 text-sm text-kx-muted">No matches.</li> : null}
        </ul>
      </div>
    </div>
  );
}
