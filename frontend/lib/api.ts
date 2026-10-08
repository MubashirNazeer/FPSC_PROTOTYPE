import { toast } from "./toast";

/**
 * Browser: same-origin `/api/v1` (Next rewrites → Django).
 * Server/SSR: API_INTERNAL_URL (Docker) or localhost.
 * Override with NEXT_PUBLIC_API_URL if needed.
 */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    return "/api/v1";
  }
  if (process.env.API_INTERNAL_URL) {
    return `${process.env.API_INTERNAL_URL}/api/v1`;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://127.0.0.1:8000/api/v1";
}

/** Prefer getApiBase() — static default for rare SSR imports */
export const API_BASE = "http://127.0.0.1:8000/api/v1";

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  data: T;
  message: string;
};

type MutateOptions = {
  auth?: boolean;
  /** When false, skip success/error toast (default true for POST/PATCH). */
  notify?: boolean;
};

function notifyMutation(ok: boolean, message: string, notify?: boolean): void {
  if (notify === false || typeof window === "undefined") return;
  toast(message || (ok ? "Saved." : "Request failed."), ok ? "ok" : "err");
}

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
  const res = await fetch(`${getApiBase()}/auth/token/`, {
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
  const res = await fetch(`${getApiBase()}${path}`, {
    headers,
    cache: "no-store",
  });
  return parseResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  data?: unknown,
  options?: MutateOptions
): Promise<ApiEnvelope<T>> {
  const headers: HeadersInit =
    options?.auth === false
      ? { "Content-Type": "application/json" }
      : authHeaders();
  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: "POST",
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    const body = await parseResponse<T>(res);
    notifyMutation(true, body.message || "Action completed.", options?.notify);
    return body;
  } catch (err) {
    notifyMutation(
      false,
      err instanceof Error ? err.message : "Request failed.",
      options?.notify
    );
    throw err;
  }
}

export async function apiPatch<T>(
  path: string,
  data?: unknown,
  options?: MutateOptions
): Promise<ApiEnvelope<T>> {
  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    const body = await parseResponse<T>(res);
    notifyMutation(true, body.message || "Updated.", options?.notify);
    return body;
  } catch (err) {
    notifyMutation(
      false,
      err instanceof Error ? err.message : "Update failed.",
      options?.notify
    );
    throw err;
  }
}
