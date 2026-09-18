import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError, api, setTokens, type Envelope } from "../lib/api";
import { Button, Input, Label } from "../components/ui";

function AuthFrame({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-kx-border bg-kx-surface p-8 shadow-kx">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl tracking-[0.32em]">KUROX</div>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-kx-subtle">
            Studio Operations. CRM. Production. Growth.
          </p>
          <h1 className="mt-6 font-display text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-kx-muted">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("arjun@aperture.kurox.dev");
  const [password, setPassword] = useState("Kurox!studio1");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!loading && session) return <Navigate to={session.user.roles.includes("client") ? "/client" : "/app"} replace />;

  return (
    <AuthFrame title="Sign in" subtitle="Command center for your studio">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          try {
            await login(email, password);
            navigate("/app");
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Unable to sign in");
          } finally {
            setPending(false);
          }
        }}
      >
        {error ? <p className="rounded-lg bg-kx-danger/15 px-3 py-2 text-sm text-kx-danger">{error}</p> : null}
        <div>
          <Label>Email</Label>
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-kx-muted">
          New studio?{" "}
          <Link className="text-kx-accent" to="/signup">
            Create organization
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link className="text-kx-subtle hover:text-kx-text" to="/forgot-password">
            Forgot password
          </Link>
        </p>
        <p className="text-center text-[11px] text-kx-subtle">Demo after seed: arjun@aperture.kurox.dev / Kurox!studio1</p>
      </form>
    </AuthFrame>
  );
}

export function SignupPage() {
  const { register, session, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    organization_name: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!loading && session) return <Navigate to="/app" replace />;

  return (
    <AuthFrame title="Create workspace" subtitle="Your studio’s operating system">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          try {
            await register(form);
            navigate("/app");
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Unable to create workspace");
          } finally {
            setPending(false);
          }
        }}
      >
        {error ? <p className="rounded-lg bg-kx-danger/15 px-3 py-2 text-sm text-kx-danger">{error}</p> : null}
        <div>
          <Label>Organization</Label>
          <Input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>First name</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
          </div>
          <div>
            <Label>Last name</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <Label>Password (min 10)</Label>
          <Input type="password" minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Creating…" : "Create workspace"}
        </Button>
        <p className="text-center text-sm text-kx-muted">
          Already have an account?{" "}
          <Link className="text-kx-accent" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <AuthFrame title="Reset password" subtitle="We’ll email a link if the account exists">
      {done ? (
        <p className="text-sm text-kx-muted">
          If that email exists, a reset link was sent. In development it is printed in the API console.
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            try {
              await api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
              setDone(true);
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Unable to send reset");
            } finally {
              setPending(false);
            }
          }}
        >
          {error ? <p className="rounded-lg bg-kx-danger/15 px-3 py-2 text-sm text-kx-danger">{error}</p> : null}
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link className="text-kx-accent" to="/login">
          Back to sign in
        </Link>
      </p>
    </AuthFrame>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <AuthFrame title="Choose a new password" subtitle="Minimum 10 characters">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
            try {
            await api("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
            navigate("/login");
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Unable to reset password");
          } finally {
            setPending(false);
          }
        }}
      >
        {error ? <p className="rounded-lg bg-kx-danger/15 px-3 py-2 text-sm text-kx-danger">{error}</p> : null}
        <div>
          <Label>New password</Label>
          <Input type="password" minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button className="w-full" disabled={pending || !token} type="submit">
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthFrame>
  );
}

export function AcceptInvitePage() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [form, setForm] = useState({ first_name: "", last_name: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <AuthFrame title="Join studio" subtitle="Set your name and password">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          try {
            const res = await api<Envelope<{ tokens: { access_token: string; refresh_token: string } }>>(
              "/auth/accept-invite",
              { method: "POST", body: JSON.stringify({ token, ...form }) },
            );
            setTokens(res.data.tokens.access_token, res.data.tokens.refresh_token);
            window.location.href = "/app";
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Invite failed");
          } finally {
            setPending(false);
          }
        }}
      >
        {error ? <p className="rounded-lg bg-kx-danger/15 px-3 py-2 text-sm text-kx-danger">{error}</p> : null}
        <div>
          <Label>First name</Label>
          <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
        </div>
        <div>
          <Label>Last name</Label>
          <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
        </div>
        <div>
          <Label>Password (min 10)</Label>
          <Input type="password" minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <Button className="w-full" disabled={pending || !token} type="submit">
          {pending ? "Joining…" : "Accept invite"}
        </Button>
      </form>
    </AuthFrame>
  );
}
