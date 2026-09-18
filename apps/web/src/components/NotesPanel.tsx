import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, type Envelope } from "../lib/api";
import { Button, Input } from "./ui";

type Note = { id: string; body: string; is_client_visible: boolean; created_at: string | null };

export function NotesPanel({ entityType, entityId }: { entityType: string; entityId: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [clientVisible, setClientVisible] = useState(false);
  const q = useQuery({
    queryKey: ["notes", entityType, entityId],
    queryFn: () => api<Envelope<Note[]>>(`/notes?entity_type=${entityType}&entity_id=${entityId}`),
    enabled: Boolean(entityId),
  });
  const create = useMutation({
    mutationFn: () =>
      api("/notes", {
        method: "POST",
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId, body, is_client_visible: clientVisible }),
      }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["notes", entityType, entityId] });
    },
  });

  return (
    <div>
      <h2 className="mb-2 text-sm font-medium">Notes</h2>
      <ul className="mb-3 max-h-48 space-y-2 overflow-y-auto text-sm">
        {(q.data?.data || []).map((n) => (
          <li key={n.id} className="rounded-lg border border-kx-border px-3 py-2">
            <p>{n.body}</p>
            <p className="mt-1 text-[11px] text-kx-subtle">
              {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
              {n.is_client_visible ? " · visible to client" : " · internal"}
            </p>
          </li>
        ))}
        {!q.data?.data.length ? <li className="text-kx-muted">No notes yet.</li> : null}
      </ul>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) create.mutate();
        }}
      >
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a production note…" />
        <label className="flex items-center gap-2 text-xs text-kx-muted">
          <input type="checkbox" checked={clientVisible} onChange={(e) => setClientVisible(e.target.checked)} />
          Visible to client
        </label>
        <Button type="submit" disabled={create.isPending || !body.trim()}>
          Add note
        </Button>
      </form>
    </div>
  );
}
