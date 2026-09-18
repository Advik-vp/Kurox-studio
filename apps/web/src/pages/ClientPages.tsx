import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Envelope } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Button, Card, statusTone } from "../components/ui";
import { greeting } from "../lib/cn";

export function ClientHome() {
  const { session, logout } = useAuth();
  const qc = useQueryClient();
  const projects = useQuery({
    queryKey: ["client-projects"],
    queryFn: () => api<Envelope<{ id: string; name: string; status: string; progress: number }[]>>("/projects"),
  });
  const assets = useQuery({
    queryKey: ["client-assets"],
    queryFn: () => api<Envelope<{ id: string; title: string; status: string }[]>>("/assets"),
  });
  const quotes = useQuery({
    queryKey: ["client-quotes"],
    queryFn: () => api<Envelope<{ id: string; number: string; status: string; total_minor: number }[]>>("/quotes"),
  });
  const approve = useMutation({
    mutationFn: (id: string) => api(`/assets/${id}/approve`, { method: "POST", body: JSON.stringify({}) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-assets"] }),
  });
  const changes = useMutation({
    mutationFn: (id: string) =>
      api(`/assets/${id}/request-changes`, {
        method: "POST",
        body: JSON.stringify({ comment: "Please revise this cut — notes in email." }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-assets"] }),
  });

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="font-display tracking-[0.28em]">KUROX</div>
          <h1 className="mt-2 font-display text-3xl">
            {greeting()}, {session?.user.first_name}
          </h1>
          <p className="text-sm text-kx-muted">Client portal · {session?.organization?.name}</p>
        </div>
        <Button variant="ghost" onClick={() => logout()}>
          Sign out
        </Button>
      </header>
      <section className="mb-8">
        <h2 className="mb-3 text-sm uppercase tracking-wide text-kx-subtle">Projects</h2>
        <div className="grid gap-3">
          {(projects.data?.data || []).map((p) => (
            <Card key={p.id}>
              <div className="flex justify-between">
                <div className="font-medium">{p.name}</div>
                <Badge tone={statusTone(p.status)}>{p.status.replaceAll("_", " ")}</Badge>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-kx-hover">
                <div className="h-1.5 rounded-full bg-kx-accent" style={{ width: `${p.progress}%` }} />
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section className="mb-8">
        <h2 className="mb-3 text-sm uppercase tracking-wide text-kx-subtle">Deliverables for review</h2>
        {(assets.data?.data || [])
          .filter((a) => a.status === "client_review" || a.status === "approved")
          .map((a) => (
            <Card key={a.id} className="mb-2 flex items-center justify-between gap-3">
              <span>{a.title}</span>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(a.status)}>{a.status.replaceAll("_", " ")}</Badge>
                {a.status === "client_review" ? (
                  <>
                    <Button onClick={() => approve.mutate(a.id)}>Approve</Button>
                    <Button variant="outline" onClick={() => changes.mutate(a.id)}>
                      Request changes
                    </Button>
                  </>
                ) : null}
              </div>
            </Card>
          ))}
      </section>
      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wide text-kx-subtle">Quotes</h2>
        {(quotes.data?.data || []).map((q) => (
          <Card key={q.id} className="mb-2 flex justify-between">
            <span className="font-mono text-sm">{q.number}</span>
            <Badge tone={statusTone(q.status)}>{q.status}</Badge>
          </Card>
        ))}
      </section>
      <p className="mt-10 text-center text-xs text-kx-subtle">
        Internal notes, other clients, and crew rates are not visible here.
      </p>
      <p className="mt-2 text-center text-xs">
        <Link className="text-kx-muted" to="/login">
          Staff login
        </Link>
      </p>
    </div>
  );
}
