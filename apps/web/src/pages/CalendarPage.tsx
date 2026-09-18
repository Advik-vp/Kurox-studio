import { useQuery } from "@tanstack/react-query";
import { api, type Envelope } from "../lib/api";
import { Badge, Card, PageHeader, statusTone } from "../components/ui";

type Event = { id: string; type: string; title: string; starts_at: string; location: string | null };

export function CalendarPage() {
  const q = useQuery({ queryKey: ["calendar"], queryFn: () => api<Envelope<Event[]>>("/calendar/events") });
  return (
    <div>
      <PageHeader title="Calendar" subtitle="Shoots, follow-ups, invoice dues — Google/Outlook sync is an adapter (not live)" />
      <div className="space-y-2">
        {(q.data?.data || []).map((e) => (
          <Card key={e.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{e.title}</div>
              <div className="text-sm text-kx-muted">
                {new Date(e.starts_at).toLocaleString()} · {e.location}
              </div>
            </div>
            <Badge tone={statusTone(e.type)}>{e.type}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
