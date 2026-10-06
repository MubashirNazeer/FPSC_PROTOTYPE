"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

type Sitting = {
  id: number;
  code?: string;
  status: string;
  mode?: string;
  centre?: { name?: string };
};

export default function StaffCbtPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [rows, setRows] = useState<Sitting[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    apiGet<Sitting[]>("/cbt/sittings/")
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function goLive(id: number) {
    setMsg(null);
    try {
      await apiPost(`/cbt/sittings/${id}/go_live/`, {});
      setMsg(`Sitting #${id} is LIVE.`);
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not go live.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">CBT — Examination sittings</h1>
      {msg ? <div className="alert alert-info">{msg}</div> : null}
      <DataTable<Sitting>
        rows={rows}
        getRowKey={(r) => r.id}
        columns={[
          { key: "code", header: "Code" },
          {
            key: "centre",
            header: "Centre",
            render: (r) => r.centre?.name || "—",
          },
          { key: "mode", header: "Mode" },
          {
            key: "status",
            header: "Status",
            render: (r) => <StatusBadge status={r.status} />,
          },
          {
            key: "actions",
            header: "Actions",
            render: (r) => (
              <span style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                <Button variant="secondary" onClick={() => goLive(r.id)}>
                  Go live
                </Button>
                <Link href={`/staff/cbt/invigilator/${r.id}`}>Invigilator board</Link>
              </span>
            ),
          },
        ]}
      />
    </StaffShell>
  );
}
