"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

import styles from "../mgmt.module.css";

type ExamType = {
  id: number;
  code?: string;
  name?: string;
  stages?: string[];
  is_active?: boolean;
};
type UemExam = {
  id: number;
  title?: string;
  current_stage?: string;
  exam_type?: number;
  exam_type_name?: string;
};

export default function StaffUemPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [types, setTypes] = useState<ExamType[]>([]);
  const [exams, setExams] = useState<UemExam[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [typeForm, setTypeForm] = useState({
    code: "",
    name: "",
    stages: "AD,APPLY,EXAM,RESULT",
  });
  const [examForm, setExamForm] = useState({ title: "", exam_type: "" });

  const load = async () => {
    const [t, e] = await Promise.all([
      apiGet<ExamType[]>("/exam-types/"),
      apiGet<UemExam[]>("/uem-exams/"),
    ]);
    setTypes(Array.isArray(t.data) ? t.data : []);
    setExams(Array.isArray(e.data) ? e.data : []);
  };

  useEffect(() => {
    if (!user) return;
    load().catch(() => {
      setTypes([]);
      setExams([]);
    });
  }, [user]);

  async function createType(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/exam-types/", {
        code: typeForm.code.toUpperCase(),
        name: typeForm.name,
        stages: typeForm.stages.split(",").map((s) => s.trim()).filter(Boolean),
        is_active: true,
      });
      setMsg("Exam type created.");
      setTypeForm({ code: "", name: "", stages: "AD,APPLY,EXAM,RESULT" });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Create type failed.");
    }
  }

  async function createExam(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/uem-exams/", {
        title: examForm.title,
        exam_type: Number(examForm.exam_type),
      });
      setMsg("UEM exam instance created.");
      setExamForm({ title: "", exam_type: "" });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Create exam failed.");
    }
  }

  async function advance(id: number) {
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/uem-exams/${id}/advance_stage/`, {});
      setMsg(`Exam #${id} stage advanced.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Advance failed.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">UEM — Unified Examination Management</h1>
      <p className={styles.help}>
        Configure exam types without code changes and run instances through
        admin-defined stages (RFP Module 3).
      </p>
      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {err ? <div className="alert alert-error">{err}</div> : null}

      <div className="stack">
        <div className="card stack">
          <h3>Define exam type</h3>
          <form className={styles.formGrid} onSubmit={createType}>
            <div className="form-field">
              <label>Code</label>
              <input
                required
                value={typeForm.code}
                onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                placeholder="FPOE"
              />
            </div>
            <div className="form-field">
              <label>Name</label>
              <input
                required
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              />
            </div>
            <div className="form-field formGridFull">
              <label>Stages (comma-separated)</label>
              <input
                required
                value={typeForm.stages}
                onChange={(e) => setTypeForm({ ...typeForm, stages: e.target.value })}
              />
            </div>
            <div className="form-field" style={{ alignSelf: "end" }}>
              <Button type="submit">Save exam type</Button>
            </div>
          </form>
          <DataTable<ExamType>
            rows={types}
            getRowKey={(r) => r.id}
            columns={[
              { key: "code", header: "Code" },
              { key: "name", header: "Name" },
              {
                key: "stages",
                header: "Stages",
                render: (r) => (r.stages || []).join(" → ") || "—",
              },
            ]}
          />
        </div>

        <div className="card stack">
          <h3>Start exam instance</h3>
          <form className={styles.formGrid} onSubmit={createExam}>
            <div className="form-field">
              <label>Title</label>
              <input
                required
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Exam type</label>
              <select
                required
                value={examForm.exam_type}
                onChange={(e) =>
                  setExamForm({ ...examForm, exam_type: e.target.value })
                }
              >
                <option value="">Select type</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field" style={{ alignSelf: "end" }}>
              <Button type="submit">Create instance</Button>
            </div>
          </form>
          <DataTable<UemExam>
            rows={exams}
            getRowKey={(r) => r.id}
            columns={[
              { key: "title", header: "Title" },
              {
                key: "exam_type_name",
                header: "Type",
                render: (r) => r.exam_type_name || "—",
              },
              {
                key: "current_stage",
                header: "Stage",
                render: (r) => <StatusBadge status={r.current_stage} />,
              },
              {
                key: "actions",
                header: "",
                render: (r) => (
                  <Button variant="secondary" onClick={() => advance(r.id)}>
                    Advance stage
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
