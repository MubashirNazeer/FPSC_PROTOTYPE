"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "gold";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  href?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  href,
  className = "",
  children,
  ...rest
}: Props) {
  const cls = `${styles.btn} ${styles[variant]} ${className}`.trim();
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={rest.type ?? "button"} className={cls} {...rest}>
      {children}
    </button>
  );
}
