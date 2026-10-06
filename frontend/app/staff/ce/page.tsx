"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet } from "@/lib/api";

type CeCycle = {
  id: number;
  name?: string;
  year?: number;
  status: string;
};

export default function StaffCePage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [rows, setRows] = useState<CeCycle[]>([]);

  useEffect(() => {
    if (!user) return;
    apiGet<CeCycle[]>("/ce-cycles/")
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRows([]));
  }, [user]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">Competitive Examination cycles</h1>
      <DataTable<CeCycle>
        rows={rows}
        getRowKey={(r) => r.id}
        columns={[
          { key: "name", header: "Cycle" },
          { key: "year", header: "Year" },
          {
            key: "status",
            header: "Status",
            render: (r) => <StatusBadge status={r.status} />,
          },
        ]}
      />
    </StaffShell>
  );
}
