const BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function getTokens() {
  return {
    access: localStorage.getItem("kx_access"),
    refresh: localStorage.getItem("kx_refresh"),
  };
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("kx_access", access);
  localStorage.setItem("kx_refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("kx_access");
  localStorage.removeItem("kx_refresh");
}

async function refreshAccess(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const tokens = json.data?.tokens;
  if (!tokens) return null;
  setTokens(tokens.access_token, tokens.refresh_token);
  return tokens.access_token as string;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const { access } = getTokens();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (access) headers.set("Authorization", `Bearer ${access}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 401 && retry) {
    const next = await refreshAccess();
    if (next) return api<T>(path, init, false);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new ApiError(
      json.error?.message || res.statusText || "Request failed",
      json.error?.code || "ERROR",
      res.status,
    );
  }
  return json as T;
}

export type Envelope<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: { page: number; page_size: number; total: number };
};
