import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "./Button";
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
          <nav className={styles.nav}>
            <Link href="/about">About</Link>
            <Link href="/ads">Advertisements</Link>
            <Link href="/flows">Process Flows</Link>
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
      <footer className={styles.footer}>
        <div className="container">
          <p>
            © {new Date().getFullYear()} Federal Public Service Commission —
            Digitalization ERP (MVP Demo)
          </p>
        </div>
      </footer>
    </div>
  );
}
