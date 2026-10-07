"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { StaffShell } from "@/components/StaffShell";
import { useAuthGuard } from "@/lib/auth";
import { apiGet } from "@/lib/api";

type DashboardData = Record<string, unknown>;

export default function StaffDashboardPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [data, setData] = useState<DashboardData | null>(null);
  const [workload, setWorkload] = useState<unknown>(null);
  const [scrutiny, setScrutiny] = useState<unknown>(null);

  useEffect(() => {
    if (!user) return;
    apiGet<DashboardData>("/dashboard/")
      .then((res) => setData(res.data))
      .catch(() => setData(null));
    apiGet("/reports/centre-workload/")
      .then((res) => setWorkload(res.data))
      .catch(() => setWorkload(null));
    apiGet("/reports/scrutiny/")
      .then((res) => setScrutiny(res.data))
      .catch(() => setScrutiny(null));
  }, [user]);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading…</div>;
  }

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">Executive dashboard</h1>
      <p className="page-lead">
        Cross-module KPIs for recruitment, examinations, and CBT operations
        (SUP-6.6 / DSS).
      </p>
      <p style={{ marginBottom: "1rem" }}>
        Quick links:{" "}
        <Link href="/staff/gr">GR</Link>
        {" · "}
        <Link href="/staff/ce">CE</Link>
        {" · "}
        <Link href="/staff/uem">UEM</Link>
        {" · "}
        <Link href="/staff/qdb">QDBMS</Link>
        {" · "}
        <Link href="/staff/cbt">CBT</Link>
        {" · "}
        <Link href="/staff/notifications">Notifications</Link>
      </p>
      {!data ? (
        <div className="card">
          <p className="muted">Dashboard metrics unavailable.</p>
        </div>
      ) : (
        <div className="grid-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="card">
              <h3 style={{ textTransform: "capitalize" }}>
                {key.replace(/_/g, " ")}
              </h3>
              <pre
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  whiteSpace: "pre-wrap",
                  color: "var(--fpsc-muted)",
                }}
              >
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
          <div className="card">
            <h3>Centre workload</h3>
            <pre
              style={{
                margin: 0,
                fontSize: "0.82rem",
                whiteSpace: "pre-wrap",
                color: "var(--fpsc-muted)",
              }}
            >
              {JSON.stringify(workload, null, 2)}
            </pre>
          </div>
          <div className="card">
            <h3>Scrutiny stats</h3>
            <pre
              style={{
                margin: 0,
                fontSize: "0.82rem",
                whiteSpace: "pre-wrap",
                color: "var(--fpsc-muted)",
              }}
            >
              {JSON.stringify(scrutiny, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </StaffShell>
  );
}
