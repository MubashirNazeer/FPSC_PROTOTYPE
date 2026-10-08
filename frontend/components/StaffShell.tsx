"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { logout } from "@/lib/auth";

import { Button } from "./Button";
import { ToastHost } from "./ToastHost";
import styles from "./StaffShell.module.css";

type NavItem = {
  href: string;
  mark: string;
  label: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/staff", mark: "", label: "Executive dashboard" },
      { href: "/staff/notifications", mark: "", label: "eCase & notifications" },
    ],
  },
  {
    title: "Examination Management",
    items: [
      { href: "/staff/gr", mark: "M1", label: "General Recruitment" },
      {
        href: "/staff/gr?tab=applications",
        mark: "M1",
        label: "Scrutiny rule engine",
      },
      { href: "/staff/ce", mark: "M2", label: "CSS Competitive Exam" },
      { href: "/staff/uem", mark: "M3", label: "Unified Exam Module" },
    ],
  },
  {
    title: "Candidates",
    items: [
      { href: "/portal", mark: "M4", label: "Candidate portal" },
      { href: "/staff/gr?tab=appeals", mark: "CC", label: "Grievances / appeals" },
    ],
  },
  {
    title: "CBT & Question Bank",
    items: [
      { href: "/staff/qdb", mark: "M5", label: "Question Data Bank" },
      { href: "/staff/qdb?tab=papers", mark: "M5", label: "Paper generation" },
      { href: "/staff/cbt", mark: "M5", label: "CBT sites & sittings" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/staff/supporting", mark: "M6", label: "Duty, inventory, transport" },
      { href: "/staff/cms", mark: "WEB", label: "Website / CMS" },
      { href: "/staff/notifications", mark: "CC", label: "Audit & notifications" },
    ],
  },
];

type Props = {
  children: ReactNode;
  userLabel?: string;
};

function pathActive(pathname: string, href: string): boolean {
  const base = href.split("?")[0];
  if (base === "/staff") return pathname === "/staff";
  if (base === "/portal") return pathname.startsWith("/portal");
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function StaffShell({ children, userLabel }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sideOpen, setSideOpen] = useState(false);
  const [q, setQ] = useState("");
  const [showRes, setShowRes] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const initials = useMemo(() => {
    if (!userLabel) return "ST";
    return userLabel.slice(0, 2).toUpperCase();
  }, [userLabel]);

  const searchHits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const hits: { label: string; href: string; sub: string }[] = [];
    for (const g of NAV) {
      for (const item of g.items) {
        if (
          item.label.toLowerCase().includes(s) ||
          item.mark.toLowerCase().includes(s) ||
          g.title.toLowerCase().includes(s)
        ) {
          hits.push({
            label: item.label,
            href: item.href,
            sub: `${g.title}${item.mark ? ` · ${item.mark}` : ""}`,
          });
        }
      }
    }
    return hits.slice(0, 8);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(t)) {
        setShowRes(false);
      }
      if (!(e.target as HTMLElement).closest?.(`.${styles.notifWrap}`)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    setSideOpen(false);
  }, [pathname]);

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${sideOpen ? styles.sideShow : ""}`}>
        <div className={styles.sideBrand}>
          <span className={styles.mark}>FPSC</span>
          <div>
            <strong>FPSC Integrated ERP</strong>
            <small>Recruitment & Examination Platform</small>
          </div>
        </div>
        <nav className={styles.sideNav} aria-label="Staff modules">
          {NAV.map((group) => (
            <div key={group.title} className={styles.navGroup}>
              <h6>{group.title}</h6>
              {group.items.map((item) => {
                const active = pathActive(pathname, item.href);
                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className={active ? styles.active : undefined}
                    onClick={() => setSideOpen(false)}
                  >
                    <span className={styles.mk}>{item.mark || "·"}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className={styles.sideFooter}>
          {userLabel ? <p className={styles.user}>{userLabel}</p> : null}
          <Button
            variant="ghost"
            className={styles.sideSignOut}
            onClick={() => logout("/staff/login")}
          >
            Sign out
          </Button>
          <Link href="/" className={styles.publicLink}>
            Public website
          </Link>
        </div>
      </aside>

      {sideOpen ? (
        <button
          type="button"
          className={styles.scrim}
          aria-label="Close menu"
          onClick={() => setSideOpen(false)}
        />
      ) : null}

      <div className={styles.content}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Open menu"
            onClick={() => setSideOpen((v) => !v)}
          >
            ☰
          </button>
          <div className={styles.search} ref={searchRef}>
            <svg
              className={styles.searchIcon}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setShowRes(true);
              }}
              onFocus={() => setShowRes(true)}
              placeholder="Search modules, cases, candidates…"
              aria-label="Global search"
            />
            {showRes && searchHits.length > 0 ? (
              <div className={styles.sres}>
                {searchHits.map((h) => (
                  <button
                    key={h.href + h.label}
                    type="button"
                    onClick={() => {
                      router.push(h.href);
                      setShowRes(false);
                      setQ("");
                    }}
                  >
                    {h.label}
                    <small>{h.sub}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className={styles.sp} />
          <div className={styles.notifWrap}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Notifications"
              onClick={(e) => {
                e.stopPropagation();
                setNotifOpen((v) => !v);
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
                <path d="M10 20a2 2 0 0 0 4 0" />
              </svg>
              <span className={styles.dot} />
            </button>
            {notifOpen ? (
              <div className={styles.notif}>
                <header>Notifications</header>
                <div className={styles.nItem}>
                  eCase / template alerts appear in Notifications
                  <small>Open the Notifications module</small>
                </div>
                <div className={styles.nItem}>
                  <Link href="/staff/notifications" onClick={() => setNotifOpen(false)}>
                    Go to notification centre →
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
          <div className={styles.role}>
            <span className={styles.roleLabel}>Staff EMS</span>
            <div className={styles.avatar}>{initials}</div>
          </div>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}
