"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

type Requisition = {
  id: number;
  case_number?: string;
  post_title?: string;
  status: string;
};

export default function StaffGrPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [rows, setRows] = useState<Requisition[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    apiGet<Requisition[]>("/requisitions/")
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function advance(id: number) {
    setMsg(null);
    try {
      await apiPost(`/requisitions/${id}/advance/`, { note: "Advanced from EMS UI" });
      setMsg(`Requisition #${id} advanced.`);
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Advance failed.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">General Recruitment — Requisitions</h1>
      {msg ? <div className="alert alert-info">{msg}</div> : null}
      <DataTable<Requisition>
        rows={rows}
        getRowKey={(r) => r.id}
        columns={[
          { key: "case_number", header: "Case No." },
          { key: "post_title", header: "Post" },
          {
            key: "status",
            header: "Status",
            render: (r) => <StatusBadge status={r.status} />,
          },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <Button variant="secondary" onClick={() => advance(r.id)}>
                Advance
              </Button>
            ),
          },
        ]}
      />
    </StaffShell>
  );
}
