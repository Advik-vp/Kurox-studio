import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Envelope } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Button, Card, Input, Label, PageHeader } from "../components/ui";
import { useState } from "react";

export function TeamPage() {
  const qc = useQueryClient();
  const { has } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("team_member");
  const q = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      api<Envelope<{ id: string; email: string; first_name: string; last_name: string; roles: string[]; status: string }[]>>(
        "/users",
      ),
  });
  const invite = useMutation({
    mutationFn: () => api("/users/invites", { method: "POST", body: JSON.stringify({ email, role_key: role }) }),
    onSuccess: () => {
      setEmail("");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
  return (
    <div>
      <PageHeader title="Team" subtitle="RBAC is enforced on the API — hiding a nav item is not security" />
      {has("team.invite") ? (
        <Card className="mb-4">
          <form
            className="grid gap-3 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              invite.mutate();
            }}
          >
            <div>
              <Label>Invite email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="w-full rounded-lg border border-kx-border bg-kx-elevated px-3 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {["production_manager", "marketer", "seo_specialist", "accountant", "team_member", "client"].map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={invite.isPending}>
                Send invite
              </Button>
            </div>
          </form>
          {invite.isSuccess ? (
            <p className="mt-2 text-xs text-kx-muted">Invite sent. In development the accept token is logged by the API.</p>
          ) : null}
        </Card>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-kx-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-kx-elevated text-xs uppercase text-kx-subtle">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.data || []).map((u) => (
              <tr key={u.id} className="border-t border-kx-border">
                <td className="px-4 py-3">
                  {u.first_name} {u.last_name}
                </td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  {u.roles.map((r) => (
                    <Badge key={r}>{r.replaceAll("_", " ")}</Badge>
                  ))}
                </td>
                <td className="px-4 py-3">{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { session } = useAuth();
  return (
    <div>
      <PageHeader title="Settings" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-medium">Organization</h2>
          <p>{session?.organization?.name}</p>
          <p className="text-sm text-kx-muted">Currency {session?.organization?.currency}</p>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-medium">Integrations</h2>
          <ul className="space-y-1 text-sm text-kx-muted">
            <li>Email — console adapter (implemented)</li>
            <li>Storage — local/S3 port (implemented)</li>
            <li>Payments — NoOp (Stripe/Razorpay later)</li>
            <li>Google Ads / Meta / GSC — Phase 3</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
