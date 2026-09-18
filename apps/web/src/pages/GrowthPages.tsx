import { useQuery } from "@tanstack/react-query";
import { api, type Envelope } from "../lib/api";
import { Badge, Card, PageHeader, PlaceholderBanner } from "../components/ui";
import { DashboardPage } from "./DashboardPage";

export function MarketingPage() {
  const q = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api<Envelope<{ items: { id: string; name: string; platform: string; status: string; budget_minor: number }[]; integration: { connected: boolean } }>>("/marketing/campaigns"),
  });
  const items = q.data?.data.items || [];
  return (
    <div>
      <PageHeader title="Marketing campaigns" />
      <PlaceholderBanner>
        Phase 3: Google Ads / Meta / LinkedIn adapters. Campaign records are real; live ROAS is not fabricated.
      </PlaceholderBanner>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((c) => (
          <Card key={c.id}>
            <div className="flex justify-between">
              <div className="font-medium">{c.name}</div>
              <Badge>{c.platform}</Badge>
            </div>
            <div className="mt-2 text-sm text-kx-muted">{c.status}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SeoPage() {
  const q = useQuery({
    queryKey: ["seo"],
    queryFn: () =>
      api<Envelope<{ items: { id: string; name: string; website_url: string; status: string }[] }>>("/seo/projects"),
  });
  return (
    <div>
      <PageHeader title="SEO projects" subtitle="Client → Website → Keywords → Content → Tasks → Reports" />
      <PlaceholderBanner>Search Console adapter is NoOp until Phase 3. Keyword rows can still be stored manually via API.</PlaceholderBanner>
      {(q.data?.data.items || []).map((p) => (
        <Card key={p.id} className="mb-3">
          <div className="font-medium">{p.name}</div>
          <div className="text-sm text-kx-muted">{p.website_url}</div>
        </Card>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="CRM + production + finance aggregates from live tables" />
      <DashboardPage />
    </div>
  );
}

export function AutomationPage() {
  const q = useQuery({
    queryKey: ["automation"],
    queryFn: () => api<Envelope<{ id: string; name: string; trigger_type: string; is_enabled: boolean }[]>>("/automation/rules"),
  });
  return (
    <div>
      <PageHeader title="Automation" subtitle="Trigger → conditions → actions → log. Visual builder is Phase 5." />
      {(q.data?.data || []).map((r) => (
        <Card key={r.id} className="mb-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="font-mono text-xs text-kx-muted">{r.trigger_type}</div>
          </div>
          <Badge tone={r.is_enabled ? "green" : "neutral"}>{r.is_enabled ? "on" : "off"}</Badge>
        </Card>
      ))}
    </div>
  );
}

export function MarketingAdsPage() {
  return (
    <div>
      <PageHeader title="Ads & campaign analytics" />
      <PlaceholderBanner>
        Phase 3: Google Ads / Meta / LinkedIn adapters. This screen will chart spend, CTR, CPC, and ROAS from stored
        snapshots — never invented numbers.
      </PlaceholderBanner>
    </div>
  );
}

export function SeoKeywordsPage() {
  return (
    <div>
      <PageHeader title="SEO keywords, content & reports" subtitle="Client → Website → Keywords → Content → Tasks → Reports" />
      <PlaceholderBanner>
        Keyword rows can be stored via API today. Search Console sync and ranking snapshots land in Phase 3.
      </PlaceholderBanner>
    </div>
  );
}
