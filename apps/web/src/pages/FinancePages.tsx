import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { api, type Envelope } from "../lib/api";
import { Badge, Button, Card, ErrorBanner, Input, Label, PageHeader, statusTone } from "../components/ui";
import { formatMoney } from "../lib/cn";

type Line = { description: string; quantity: number; unit_price_minor: number; tax_rate_bps: number };
type Quote = {
  id: string;
  number: string;
  customer_name: string | null;
  status: string;
  total_minor: number;
  currency: string;
  items: Line[];
};
type Invoice = Quote & { amount_paid_minor: number; due_date: string | null };

export function QuotesPage() {
  const q = useQuery({ queryKey: ["quotes"], queryFn: () => api<Envelope<Quote[]>>("/quotes") });
  const convert = useMutation({
    mutationFn: (id: string) => api(`/quotes/${id}/convert-to-project`, { method: "POST" }),
  });
  return (
    <div>
      <PageHeader title="Quotations" subtitle="Draft → Sent → Viewed → Approved → Project" actions={<Link to="/app/finance/quotes/new"><Button>New quote</Button></Link>} />
      {q.isError ? <ErrorBanner message={(q.error as Error).message} /> : null}
      <div className="overflow-x-auto rounded-xl border border-kx-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-kx-elevated text-xs uppercase text-kx-subtle">
            <tr>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(q.data?.data || []).map((row) => (
              <tr key={row.id} className="border-t border-kx-border">
                <td className="px-4 py-3 font-mono text-xs">{row.number}</td>
                <td className="px-4 py-3">{row.customer_name}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                </td>
                <td className="px-4 py-3">{formatMoney(row.total_minor, row.currency)}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => convert.mutate(row.id)}>
                    Convert to project
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function QuoteBuilderPage() {
  const nav = useNavigate();
  const customers = useQuery({
    queryKey: ["customers"],
    queryFn: () => api<Envelope<{ id: string; display_name: string }[]>>("/customers"),
  });
  const [lines, setLines] = useState<Line[]>([
    { description: "Shoot day", quantity: 1, unit_price_minor: 15000000, tax_rate_bps: 1800 },
  ]);
  const create = useMutation({
    mutationFn: (body: object) => api("/quotes", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => nav("/app/finance/quotes"),
  });
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price_minor, 0);
  const tax = lines.reduce((s, l) => s + Math.round(l.quantity * l.unit_price_minor * (l.tax_rate_bps / 10000)), 0);
  return (
    <div>
      <PageHeader title="Quote builder" />
      <form
        className="grid gap-6 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          create.mutate({ customer_id: fd.get("customer_id"), items: lines });
        }}
      >
        <Card className="lg:col-span-2">
          <Label>Customer</Label>
          <select name="customer_id" className="mb-4 w-full rounded-lg border border-kx-border bg-kx-elevated px-3 py-2 text-sm" required>
            {(customers.data?.data || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
          {lines.map((line, i) => (
            <div key={i} className="mb-3 grid gap-2 md:grid-cols-4">
              <Input
                value={line.description}
                onChange={(e) => {
                  const next = [...lines];
                  next[i].description = e.target.value;
                  setLines(next);
                }}
              />
              <Input
                type="number"
                value={line.quantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[i].quantity = Number(e.target.value);
                  setLines(next);
                }}
              />
              <Input
                type="number"
                value={line.unit_price_minor / 100}
                onChange={(e) => {
                  const next = [...lines];
                  next[i].unit_price_minor = Number(e.target.value) * 100;
                  setLines(next);
                }}
              />
              <Button type="button" variant="ghost" onClick={() => setLines(lines.filter((_, j) => j !== i))}>
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setLines([...lines, { description: "", quantity: 1, unit_price_minor: 0, tax_rate_bps: 1800 }])}>
            Add line
          </Button>
        </Card>
        <Card>
          <div className="text-sm text-kx-muted">Subtotal</div>
          <div className="font-display text-xl">{formatMoney(subtotal)}</div>
          <div className="mt-2 text-sm text-kx-muted">Tax (GST)</div>
          <div>{formatMoney(tax)}</div>
          <div className="mt-2 text-sm text-kx-muted">Total</div>
          <div className="font-display text-2xl text-kx-accent">{formatMoney(subtotal + tax)}</div>
          <Button className="mt-6 w-full" type="submit" disabled={create.isPending}>
            Save draft
          </Button>
        </Card>
      </form>
    </div>
  );
}

export function InvoicesPage() {
  const q = useQuery({ queryKey: ["invoices"], queryFn: () => api<Envelope<Invoice[]>>("/invoices") });
  return (
    <div>
      <PageHeader title="Invoices" subtitle="Manual payments in MVP · Stripe/Razorpay adapters are NoOp" />
      <div className="overflow-x-auto rounded-xl border border-kx-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-kx-elevated text-xs uppercase text-kx-subtle">
            <tr>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.data || []).map((row) => (
              <tr key={row.id} className="border-t border-kx-border">
                <td className="px-4 py-3">
                  <Link className="font-mono text-xs hover:text-kx-accent" to={`/app/finance/invoices/${row.id}`}>
                    {row.number}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.customer_name}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(row.status)}>{row.status.replaceAll("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3">{formatMoney(row.total_minor)}</td>
                <td className="px-4 py-3">{formatMoney(row.amount_paid_minor || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function InvoiceDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => api<Envelope<Invoice>>(`/invoices/${id}`),
    enabled: Boolean(id),
  });
  const inv = q.data?.data;
  const pay = useMutation({
    mutationFn: () =>
      api(`/invoices/${id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount_minor: inv?.total_minor || 0, method: "bank" }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoice", id] }),
  });
  if (q.isError) return <ErrorBanner message={(q.error as Error).message} />;
  if (!inv) return null;
  return (
    <div>
      <PageHeader title={inv.number} subtitle={inv.customer_name || ""} />
      <Card>
        <div className="flex items-center justify-between">
          <Badge tone={statusTone(inv.status)}>{inv.status}</Badge>
          <div className="font-display text-2xl">{formatMoney(inv.total_minor)}</div>
        </div>
        <Button className="mt-6" onClick={() => pay.mutate()} disabled={pay.isPending || inv.status === "paid"}>
          Record full payment (manual)
        </Button>
      </Card>
    </div>
  );
}

export function PaymentsPage() {
  const q = useQuery({
    queryKey: ["payments"],
    queryFn: () =>
      api<
        Envelope<
          {
            id: string;
            invoice_number: string | null;
            customer_name: string | null;
            amount_minor: number;
            method: string;
            paid_at: string | null;
            currency: string;
          }[]
        >
      >("/payments"),
  });
  return (
    <div>
      <PageHeader title="Payments" subtitle="Manual records in MVP · Stripe/Razorpay are NoOp adapters" />
      {q.isError ? <ErrorBanner message={(q.error as Error).message} /> : null}
      <div className="overflow-x-auto rounded-xl border border-kx-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-kx-elevated text-xs uppercase text-kx-subtle">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Paid</th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.data || []).map((p) => (
              <tr key={p.id} className="border-t border-kx-border">
                <td className="px-4 py-3 font-mono text-xs">{p.invoice_number}</td>
                <td className="px-4 py-3">{p.customer_name}</td>
                <td className="px-4 py-3">{formatMoney(p.amount_minor, p.currency)}</td>
                <td className="px-4 py-3">{p.method}</td>
                <td className="px-4 py-3 text-kx-muted">{p.paid_at ? new Date(p.paid_at).toLocaleString() : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ExpensesPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["expenses"],
    queryFn: () =>
      api<Envelope<{ id: string; category: string; amount_minor: number; vendor: string | null; incurred_on: string | null; currency: string }[]>>(
        "/expenses",
      ),
  });
  const create = useMutation({
    mutationFn: (body: object) => api("/expenses", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
  return (
    <div>
      <PageHeader title="Expenses" subtitle="Shoot and project costs for profitability" />
      <Card className="mb-4">
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            create.mutate({
              category: fd.get("category"),
              vendor: fd.get("vendor"),
              amount_minor: Number(fd.get("amount") || 0) * 100,
              incurred_on: fd.get("incurred_on") || null,
            });
            e.currentTarget.reset();
          }}
        >
          <div>
            <Label>Category</Label>
            <Input name="category" defaultValue="location" />
          </div>
          <div>
            <Label>Vendor</Label>
            <Input name="vendor" />
          </div>
          <div>
            <Label>Amount (INR)</Label>
            <Input name="amount" type="number" required />
          </div>
          <div>
            <Label>Date</Label>
            <Input name="incurred_on" type="date" />
          </div>
          <Button type="submit" disabled={create.isPending}>
            Record expense
          </Button>
        </form>
      </Card>
      {(q.data?.data || []).map((e) => (
        <Card key={e.id} className="mb-2 flex justify-between text-sm">
          <span>
            {e.category} · {e.vendor}
          </span>
          <span className="font-mono">{formatMoney(e.amount_minor, e.currency)}</span>
        </Card>
      ))}
    </div>
  );
}
