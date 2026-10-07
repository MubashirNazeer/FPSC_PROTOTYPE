"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet } from "@/lib/api";

type ExamType = { id: number; code?: string; name?: string };
type UemExam = {
  id: number;
  title?: string;
  current_stage?: string;
  exam_type_name?: string;
};

export default function StaffUemPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [types, setTypes] = useState<ExamType[]>([]);
  const [exams, setExams] = useState<UemExam[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiGet<ExamType[]>("/exam-types/"),
      apiGet<UemExam[]>("/uem-exams/"),
    ])
      .then(([t, e]) => {
        setTypes(Array.isArray(t.data) ? t.data : []);
        setExams(Array.isArray(e.data) ? e.data : []);
      })
      .catch(() => {
        setTypes([]);
        setExams([]);
      });
  }, [user]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">Unified Examination Management</h1>
      <div className="stack">
        <div className="card">
          <h3>Exam types</h3>
          <DataTable<ExamType>
            rows={types}
            getRowKey={(r) => r.id}
            columns={[
              { key: "code", header: "Code" },
              { key: "name", header: "Name" },
            ]}
          />
        </div>
        <div className="card">
          <h3>Exam instances</h3>
          <DataTable<UemExam>
            rows={exams}
            getRowKey={(r) => r.id}
            columns={[
              { key: "title", header: "Title" },
              { key: "exam_type_name", header: "Type" },
              {
                key: "current_stage",
                header: "Stage",
                render: (r) => <StatusBadge status={r.current_stage} />,
              },
            ]}
          />
        </div>
      </div>
    </StaffShell>
  );
}
