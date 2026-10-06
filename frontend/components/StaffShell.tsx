"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { logout } from "@/lib/auth";

import { Button } from "./Button";
import styles from "./StaffShell.module.css";

const NAV = [
  { href: "/staff", label: "Dashboard" },
  { href: "/staff/gr", label: "GR — Requisitions" },
  { href: "/staff/ce", label: "CE Cycles" },
  { href: "/staff/uem", label: "UEM Exams" },
  { href: "/staff/qdb", label: "Question Bank" },
  { href: "/staff/cbt", label: "CBT Sittings" },
  { href: "/staff/supporting", label: "Supporting Services" },
  { href: "/staff/cms", label: "CMS — News & Pages" },
];

type Props = {
  children: ReactNode;
  userLabel?: string;
};

export function StaffShell({ children, userLabel }: Props) {
  const pathname = usePathname();

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sideBrand}>
          <span className={styles.mark}>EMS</span>
          <div>
            <strong>FPSC Staff</strong>
            <small>Enterprise Management</small>
          </div>
        </div>
        <nav className={styles.sideNav}>
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/staff" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? styles.active : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sideFooter}>
          {userLabel ? <p className={styles.user}>{userLabel}</p> : null}
          <Button variant="ghost" onClick={() => logout("/staff/login")}>
            Sign out
          </Button>
          <Link href="/" className={styles.publicLink}>
            Public website
          </Link>
        </div>
      </aside>
      <div className={styles.content}>
        <header className={styles.topbar}>
          <span>FPSC Digitalization ERP — Staff Console</span>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
