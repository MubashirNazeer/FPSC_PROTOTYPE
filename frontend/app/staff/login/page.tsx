"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { ToastHost } from "@/components/ToastHost";

import styles from "./login.module.css";

export default function StaffLoginPage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <aside className={styles.hero}>
        <div>
          <div className={styles.heroBrand}>
            <span className={styles.seal}>FPSC</span>
            <div>
              <b>FPSC Integrated ERP</b>
              <small>Recruitment & Examination Platform</small>
            </div>
          </div>
          <div className={styles.heroCopy}>
            <h2>Staff enterprise console</h2>
            <p>
              General Recruitment, CSS, UEM, QDBMS, CBT, and supporting
              operations — aligned to FPSC/PISC/SW/2026/01.
            </p>
            <ul className={styles.heroList}>
              <li>M1 — General Recruitment lifecycle</li>
              <li>M2 — CSS competitive examination</li>
              <li>M5 — Question bank & CBT conduct</li>
            </ul>
          </div>
        </div>
        <p className={styles.heroFoot}>Authorized personnel only</p>
      </aside>
      <main className={styles.main}>
        <div className={styles.wrap}>
          <Link href="/" className={styles.back}>
            ← Public website
          </Link>
          <LoginForm
            title="Staff sign in"
            subtitle="Use your EMS username and password."
            demoHint="Demo: admin or rr.officer · password Fpsc@2026"
            onSuccess={() => router.push("/staff")}
          />
        </div>
      </main>
      <ToastHost />
    </div>
  );
}
