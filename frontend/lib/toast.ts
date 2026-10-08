export type ToastKind = "ok" | "err" | "info";

type ToastPayload = { message: string; kind: ToastKind };
type Listener = (payload: ToastPayload) => void;

let listener: Listener | null = null;

export function subscribeToast(next: Listener): () => void {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}

export function toast(message: string, kind: ToastKind = "ok"): void {
  if (!message) return;
  listener?.({ message, kind });
}
