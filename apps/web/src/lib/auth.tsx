import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearTokens, setTokens, type Envelope } from "./api";

export type KuroxUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
};

export type Session = {
  user: KuroxUser;
  permissions: string[];
  organization: { id: string; name: string; currency: string; timezone?: string } | null;
};

type AuthCtx = {
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    organization_name: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  has: (permission: string) => boolean;
  isClient: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const res = await api<Envelope<Session>>("/auth/me");
      setSession(res.data);
    } catch {
      clearTokens();
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (localStorage.getItem("kx_access")) loadMe();
    else setLoading(false);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      loading,
      async login(email, password) {
        const res = await api<
          Envelope<{ user: KuroxUser; tokens: { access_token: string; refresh_token: string }; organization: Session["organization"] }>
        >("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
        setTokens(res.data.tokens.access_token, res.data.tokens.refresh_token);
        await loadMe();
      },
      async register(payload) {
        const res = await api<
          Envelope<{ user: KuroxUser; tokens: { access_token: string; refresh_token: string } }>
        >("/auth/register", { method: "POST", body: JSON.stringify(payload) });
        setTokens(res.data.tokens.access_token, res.data.tokens.refresh_token);
        await loadMe();
      },
      async logout() {
        const refresh = localStorage.getItem("kx_refresh");
        try {
          if (refresh) await api("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refresh }) });
        } catch {
          /* ignore */
        }
        clearTokens();
        setSession(null);
      },
      has: (p) => Boolean(session?.permissions.includes(p)),
      isClient: Boolean(session?.user.roles.includes("client")),
    }),
    [session, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
