"use client";

import { useEffect, useState } from "react";

import { subscribeToast, type ToastKind } from "@/lib/toast";

import styles from "./ToastHost.module.css";

export function ToastHost() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<ToastKind>("ok");

  useEffect(() => {
    return subscribeToast(({ message: next, kind: nextKind }) => {
      setMessage(next);
      setKind(nextKind);
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setOpen(false), 2800);
    return () => window.clearTimeout(t);
  }, [open, message]);

  if (!open) return null;

  return (
    <div
      className={`${styles.toast} ${styles[kind]} ${open ? styles.show : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.mark} aria-hidden>
        {kind === "ok" ? "✓" : kind === "err" ? "!" : "i"}
      </span>
      {message}
    </div>
  );
}
