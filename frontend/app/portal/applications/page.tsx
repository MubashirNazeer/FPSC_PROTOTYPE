"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

type Application = {
  id: number;
  status: string;
  fee_paid?: boolean;
  advertisement?: { id?: number; title?: string };
};

export default function PortalApplicationsPage() {
  const { user, loading } = useAuthGuard({ redirectTo: "/portal/login" });
  const [rows, setRows] = useState<Application[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiGet<Application[] | { results: Application[] }>("/applications/")
      .then((res) => {
        const data = res.data;
        setRows(Array.isArray(data) ? data : data.results ?? []);
      })
      .catch(() => setRows([]));
  }, [user]);

  async function payFee(id: number) {
    setMsg(null);
    try {
      await apiPost(`/applications/${id}/pay/`, {});
      setMsg("Fee payment recorded.");
      const res = await apiGet<Application[] | { results: Application[] }>("/applications/");
      const data = res.data;
      setRows(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Payment failed.");
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="container">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container stack">
        <h1 className="page-title">My applications</h1>
        {msg ? <div className="alert alert-info">{msg}</div> : null}
        <DataTable<Application>
          rows={rows}
          getRowKey={(r) => r.id}
          columns={[
            { key: "id", header: "ID" },
            {
              key: "title",
              header: "Advertisement",
              render: (r) => r.advertisement?.title || "—",
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: "fee",
              header: "Fee",
              render: (r) => (r.fee_paid ? "Paid" : "Pending"),
            },
            {
              key: "actions",
              header: "Actions",
              render: (r) => (
                <span style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  {!r.fee_paid ? (
                    <Button variant="secondary" onClick={() => payFee(r.id)}>
                      Pay fee
                    </Button>
                  ) : null}
                  <Button href={`/portal/admit-card/${r.id}`} variant="ghost">
                    Admit card
                  </Button>
                </span>
              ),
            },
          ]}
        />
        <Button href="/portal/dashboard" variant="ghost">
          ← Dashboard
        </Button>
        <p className="muted">
          Need a new application? <Link href="/ads">Browse advertisements</Link>
        </p>
      </div>
    </AppShell>
  );
}
