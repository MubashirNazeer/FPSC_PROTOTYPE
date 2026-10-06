"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet } from "@/lib/api";

type InvigilatorPayload = {
  sitting?: { code?: string; status?: string };
  counts?: {
    total?: number;
    in_progress?: number;
    submitted?: number;
    anomalies?: number;
  };
  sessions?: Array<{
    id: number;
    status: string;
    candidate?: { username?: string };
    terminal_id?: string;
  }>;
};

export default function InvigilatorBoardPage() {
  const params = useParams<{ sittingId: string }>();
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [data, setData] = useState<InvigilatorPayload | null>(null);

  useEffect(() => {
    if (!user) return;
    apiGet<InvigilatorPayload>(`/cbt/sittings/${params.sittingId}/invigilator/`)
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, [user, params.sittingId]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  const sessions = data?.sessions ?? [];

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">Invigilator board</h1>
      <p className="page-lead">
        Sitting {data?.sitting?.code || params.sittingId} ·{" "}
        {data?.sitting?.status ? (
          <StatusBadge status={data.sitting.status} />
        ) : null}
      </p>
      <div className="grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <strong>Total sessions</strong>
          <p>{data?.counts?.total ?? 0}</p>
        </div>
        <div className="card">
          <strong>In progress</strong>
          <p>{data?.counts?.in_progress ?? 0}</p>
        </div>
        <div className="card">
          <strong>Submitted</strong>
          <p>{data?.counts?.submitted ?? 0}</p>
        </div>
        <div className="card">
          <strong>Anomalies</strong>
          <p>{data?.counts?.anomalies ?? 0}</p>
        </div>
      </div>
      <DataTable
        rows={sessions}
        getRowKey={(r) => r.id}
        columns={[
          { key: "id", header: "Session" },
          {
            key: "candidate",
            header: "Candidate",
            render: (r) => r.candidate?.username || "—",
          },
          { key: "terminal_id", header: "Terminal" },
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
