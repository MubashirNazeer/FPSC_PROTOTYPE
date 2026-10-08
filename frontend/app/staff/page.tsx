"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { PhaseRail } from "@/components/PhaseRail";
import { StaffShell } from "@/components/StaffShell";
import { useAuthGuard } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { GR_PHASES, grStatusToPhase } from "@/lib/grPhases";

import styles from "./mgmt.module.css";

type DashboardData = Record<string, unknown>;
type Requisition = { id: number; status: string };

export default function StaffDashboardPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [data, setData] = useState<DashboardData | null>(null);
  const [workload, setWorkload] = useState<unknown>(null);
  const [scrutiny, setScrutiny] = useState<unknown>(null);
  const [reqs, setReqs] = useState<Requisition[]>([]);

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
    apiGet<Requisition[]>("/requisitions/")
      .then((res) => setReqs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setReqs([]));
  }, [user]);

  const phaseCounts = useMemo(() => {
    const counts = GR_PHASES.map(() => 0);
    for (const r of reqs) {
      const ph = grStatusToPhase(r.status);
      counts[ph] = (counts[ph] || 0) + 1;
    }
    return counts;
  }, [reqs]);

  const appsTotal =
    data && typeof data.applications === "object" && data.applications !== null
      ? Number((data.applications as { total?: number }).total ?? 0)
      : null;

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          background: "var(--paper)",
          color: "var(--ink)",
          minHeight: "100vh",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <StaffShell userLabel={user?.username}>
      <PageHeader
        title="Executive dashboard"
        lead="Recruitment cycle, examination readiness and approvals across all wings, refreshed from the EMS database."
        refs={["SUP-6.6", "TAB-01…05"]}
      />

      <div className="grid-4" style={{ marginBottom: "1rem" }}>
        <div className="card kpi">
          <div className="kpiValue">{reqs.length}</div>
          <div className="kpiLabel">Active requisitions</div>
          <div className="kpiDelta kpiUp">GR pipeline</div>
        </div>
        <div className="card kpi">
          <div className="kpiValue">{appsTotal ?? "—"}</div>
          <div className="kpiLabel">Applications (EMS)</div>
          <div className="kpiDelta muted">Live from API</div>
        </div>
        <div className="card kpi">
          <div className="kpiValue">{phaseCounts[6] ?? 0}</div>
          <div className="kpiLabel">In scrutiny phase</div>
          <div className="kpiDelta">T&S wing</div>
        </div>
        <div className="card kpi">
          <div className="kpiValue">{phaseCounts[4] ?? 0}</div>
          <div className="kpiLabel">Test conduct</div>
          <div className="kpiDelta">CBT readiness</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 0.35rem", fontSize: "0.95rem" }}>
          General Recruitment pipeline{" "}
          <small className="muted">
            {reqs.length} active requisitions by phase
          </small>
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
            gap: 6,
            marginTop: 8,
          }}
        >
          {GR_PHASES.map((g, i) => (
            <div
              key={g.key}
              style={{
                borderTop: "5px solid var(--pine3)",
                paddingTop: 8,
                fontSize: "0.75rem",
              }}
            >
              <b style={{ display: "block", fontSize: "0.78rem" }}>{g.label}</b>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "var(--pine)",
                }}
              >
                {phaseCounts[i]}
              </span>
              <div className="muted" style={{ fontSize: "0.7rem" }}>
                {g.wing}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.legend}>
          <span>
            <i />
            Phase counts from live requisition statuses
          </span>
          <Link href="/staff/gr">Open requisitions →</Link>
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <PhaseRail phase={-1} labeled />
        </div>
      </div>

      {!data ? (
        <div className="card">
          <p className="muted">Dashboard metrics unavailable.</p>
        </div>
      ) : (
        <div className="grid-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="card">
              <h3 style={{ textTransform: "capitalize", fontSize: "0.95rem" }}>
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
            <h3 style={{ fontSize: "0.95rem" }}>Centre workload</h3>
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
            <h3 style={{ fontSize: "0.95rem" }}>Scrutiny stats</h3>
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
