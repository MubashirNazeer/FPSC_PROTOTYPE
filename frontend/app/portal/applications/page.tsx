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
  tracking_id?: string;
  advertisement_title?: string;
  advertisement_ref?: string;
  advertisement_close_date?: string | null;
  post_title?: string;
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PortalApplicationsPage() {
  const { user, loading } = useAuthGuard({ redirectTo: "/portal/login" });
  const [rows, setRows] = useState<Application[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    apiGet<Application[] | { results: Application[] }>("/applications/")
      .then((res) => {
        const data = res.data;
        setRows(Array.isArray(data) ? data : data.results ?? []);
      })
      .catch(() => setRows([]));
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function payFee(id: number) {
    setMsg(null);
    try {
      await apiPost(`/applications/${id}/pay/`, {});
      setMsg("Fee payment recorded.");
      load();
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
          emptyMessage="You have no applications yet."
          columns={[
            {
              key: "tracking_id",
              header: "Tracking ID",
              render: (r) => r.tracking_id || `#${r.id}`,
            },
            {
              key: "advertisement_title",
              header: "Advertisement",
              render: (r) => (
                <div>
                  <strong>{r.advertisement_title || "—"}</strong>
                  {r.advertisement_ref ? (
                    <div className="muted" style={{ fontSize: "0.85rem" }}>
                      {r.advertisement_ref}
                    </div>
                  ) : null}
                  {r.post_title ? (
                    <div className="muted" style={{ fontSize: "0.85rem" }}>
                      Post: {r.post_title}
                    </div>
                  ) : null}
                </div>
              ),
            },
            {
              key: "advertisement_close_date",
              header: "Last date to apply",
              render: (r) => formatDate(r.advertisement_close_date),
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
