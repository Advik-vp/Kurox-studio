import { cn } from "../lib/cn";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
}) {
  const styles = {
    primary: "bg-kx-accent text-black hover:brightness-110",
    secondary: "bg-kx-hover text-kx-text hover:bg-kx-border",
    ghost: "bg-transparent text-kx-muted hover:text-kx-text hover:bg-kx-hover",
    danger: "bg-kx-danger/90 text-white hover:bg-kx-danger",
    outline: "border border-kx-border bg-transparent hover:bg-kx-hover",
  } as const;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-kx-border bg-kx-elevated px-3 py-2 text-sm text-kx-text placeholder:text-kx-subtle",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-kx-muted">{children}</label>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-kx-border bg-kx-surface p-4", className)}>{children}</div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "green" | "red" | "blue" | "orange";
}) {
  const map = {
    neutral: "bg-kx-hover text-kx-muted",
    gold: "bg-kx-accent/15 text-kx-accent",
    green: "bg-kx-success/15 text-kx-success",
    red: "bg-kx-danger/15 text-kx-danger",
    blue: "bg-kx-info/15 text-kx-info",
    orange: "bg-kx-shoot/15 text-kx-shoot",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", map[tone])}>
      {children}
    </span>
  );
}

export function statusTone(status: string): "neutral" | "gold" | "green" | "red" | "blue" | "orange" {
  const s = status.toLowerCase();
  if (["won", "paid", "approved", "completed", "delivered", "active"].includes(s)) return "green";
  if (["lost", "rejected", "cancelled", "overdue", "disabled"].includes(s)) return "red";
  if (["production", "in_progress", "shot", "live", "sent"].includes(s)) return "orange";
  if (["review", "client_review", "proposal", "negotiation"].includes(s)) return "blue";
  if (["draft", "planning", "new", "todo"].includes(s)) return "gold";
  return "neutral";
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-kx-border px-6 py-16 text-center">
      <p className="font-display text-lg">{title}</p>
      <p className="mt-1 max-w-md text-sm text-kx-muted">{hint}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-kx-muted">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function PlaceholderBanner({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border border-dashed border-kx-accent/40 bg-kx-accent/10 px-3 py-2 text-sm text-kx-accent">
      {children}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-kx-danger/40 bg-kx-danger/10 px-3 py-2 text-sm text-kx-danger">
      <span>{message}</span>
      {onRetry ? (
        <button className="underline" onClick={onRetry} type="button">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-kx-hover", className)} />;
}
