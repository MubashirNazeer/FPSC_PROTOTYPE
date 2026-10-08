"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "gold";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  href?: string;
  children: ReactNode;
  loading?: boolean;
  title?: string;
};

export function Button({
  variant = "primary",
  href,
  className = "",
  children,
  loading = false,
  disabled,
  title,
  ...rest
}: Props) {
  const cls =
    `${styles.btn} ${styles[variant]} ${loading ? styles.loading : ""} ${className}`.trim();
  const tip = title;

  if (href) {
    return (
      <Link href={href} className={cls} title={tip} aria-busy={loading || undefined}>
        {loading ? <span className={styles.spinner} aria-hidden /> : null}
        {children}
      </Link>
    );
  }
  return (
    <button
      type={rest.type ?? "button"}
      className={cls}
      disabled={disabled || loading}
      title={tip}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : null}
      {loading ? "Working…" : children}
    </button>
  );
}
