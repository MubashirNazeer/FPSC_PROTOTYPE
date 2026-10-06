"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

type Question = {
  id: number;
  stem?: string;
  status: string;
  difficulty?: string;
};

type Paper = {
  id: number;
  title?: string;
  status: string;
};

export default function StaffQdbPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      apiGet<Question[]>("/questions/"),
      apiGet<Paper[]>("/papers/"),
    ])
      .then(([q, p]) => {
        setQuestions(Array.isArray(q.data) ? q.data : []);
        setPapers(Array.isArray(p.data) ? p.data : []);
      })
      .catch(() => {
        setQuestions([]);
        setPapers([]);
      });
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function authorizePaper(id: number) {
    setMsg(null);
    try {
      await apiPost(`/papers/${id}/authorize/`, {});
      setMsg(`Paper #${id} authorization recorded.`);
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Authorization failed.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">Question Bank & Papers</h1>
      {msg ? <div className="alert alert-info">{msg}</div> : null}
      <div className="stack">
        <div className="card">
          <h3>Questions</h3>
          <DataTable<Question>
            rows={questions.slice(0, 50)}
            getRowKey={(r) => r.id}
            columns={[
              { key: "id", header: "ID" },
              {
                key: "stem",
                header: "Stem",
                render: (r) =>
                  (r.stem || "").length > 80
                    ? `${(r.stem || "").slice(0, 80)}…`
                    : r.stem || "—",
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
            ]}
          />
        </div>
        <div className="card">
          <h3>Exam papers — dual authorization</h3>
          <DataTable<Paper>
            rows={papers}
            getRowKey={(r) => r.id}
            columns={[
              { key: "title", header: "Title" },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "actions",
                header: "",
                render: (r) => (
                  <Button variant="secondary" onClick={() => authorizePaper(r.id)}>
                    Authorize
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </div>
    </StaffShell>
  );
}
