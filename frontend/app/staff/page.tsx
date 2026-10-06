"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!user) return;
    apiGet<DashboardData>("/dashboard/")
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, [user]);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading…</div>;
  }

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">Executive dashboard</h1>
      <p className="page-lead">
        Cross-module KPIs for recruitment, examinations, and CBT operations.
      </p>
      {!data ? (
        <div className="card">
          <p className="muted">Dashboard metrics unavailable.</p>
        </div>
      ) : (
        <div className="grid-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="card">
              <h3 style={{ textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</h3>
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
        </div>
      )}
    </StaffShell>
  );
}
