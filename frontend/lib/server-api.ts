import { getApiBase, type ApiEnvelope } from "@/lib/api";

export async function fetchPublic<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as ApiEnvelope<T>;
    if (!body.success) return null;
    return body.data;
  } catch {
    return null;
  }
}
