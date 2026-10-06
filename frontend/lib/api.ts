export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  data: T;
  message: string;
};

const TOKEN_KEY = "fpsc_access_token";
const REFRESH_KEY = "fpsc_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh?: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function loginWithPassword(
  username: string,
  password: string
): Promise<{ access: string; refresh: string }> {
  const res = await fetch(`${API_BASE}/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  if (!res.ok) {
    const msg =
      body?.detail || body?.message || "Invalid username or password.";
    throw new Error(typeof msg === "string" ? msg : "Login failed.");
  }
  setTokens(body.access, body.refresh);
  return body;
}

async function parseResponse<T>(res: Response): Promise<ApiEnvelope<T>> {
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return body;
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function apiGet<T>(
  path: string,
  options?: { auth?: boolean }
): Promise<ApiEnvelope<T>> {
  const headers: HeadersInit =
    options?.auth === false
      ? { "Content-Type": "application/json" }
      : authHeaders();
  const res = await fetch(`${API_BASE}${path}`, { headers, cache: "no-store" });
  return parseResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  data?: unknown,
  options?: { auth?: boolean }
): Promise<ApiEnvelope<T>> {
  const headers: HeadersInit =
    options?.auth === false
      ? { "Content-Type": "application/json" }
      : authHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  return parseResponse<T>(res);
}

export async function apiPatch<T>(
  path: string,
  data?: unknown
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  return parseResponse<T>(res);
}
