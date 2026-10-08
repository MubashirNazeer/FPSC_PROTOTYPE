import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "./Button";
import { ToastHost } from "./ToastHost";
import styles from "./AppShell.module.css";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <div className={`fpsc-pattern ${styles.root}`}>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <Link href="/" className={styles.brand}>
            <span className={styles.emblem}>FPSC</span>
            <span>
              <strong>Federal Public Service Commission</strong>
              <small>Government of Pakistan</small>
            </span>
          </Link>
          <nav className={styles.nav} aria-label="Primary">
            <Link href="/about">About</Link>
            <Link href="/ads">Advertisements</Link>
            <Link href="/flows">Process Flows</Link>
            <Link href="/search">Search</Link>
            <Link href="/contact">Contact</Link>
            <Button href="/portal/login" variant="primary">
              Candidate Portal
            </Button>
            <Button href="/staff/login" variant="secondary">
              Staff EMS
            </Button>
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <ToastHost />
      <footer className={styles.footer}>
        <div className="container" style={{ display: "grid", gap: "0.5rem" }}>
          <p>
            © {new Date().getFullYear()} Federal Public Service Commission —
            Aga Khan Road, F-5/1, Islamabad
          </p>
          <p style={{ margin: 0 }}>
            Follow:{" "}
            <a
              href="https://www.facebook.com/FPSC.gov.pk"
              target="_blank"
              rel="noreferrer"
            >
              Facebook
            </a>
            {" · "}
            <a
              href="https://twitter.com/FPSC_Official"
              target="_blank"
              rel="noreferrer"
            >
              X / Twitter
            </a>
            {" · "}
            <a href="https://www.fpsc.gov.pk" target="_blank" rel="noreferrer">
              fpsc.gov.pk
            </a>
            {" · "}
            <Link href="/ads">Advertisements</Link>
            {" · "}
            <Link href="/search">Search</Link>
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem" }}>
            Analytics: set NEXT_PUBLIC_GA_ID for Google Analytics (WEB-4.10).
          </p>
        </div>
      </footer>
    </div>
  );
}
