"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

import styles from "../mgmt.module.css";

type CeCycle = {
  id: number;
  year?: number;
  title?: string;
  phase?: string;
  phase_display?: string;
};

export default function StaffCePage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [rows, setRows] = useState<CeCycle[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    year: String(new Date().getFullYear()),
    title: "",
  });

  const load = () =>
    apiGet<CeCycle[]>("/ce-cycles/")
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRows([]));

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function createCycle(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/ce-cycles/", {
        year: Number(form.year),
        title: form.title || `CSS Competitive Examination ${form.year}`,
      });
      setMsg("CE cycle created.");
      setForm({ year: form.year, title: "" });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Create failed.");
    }
  }

  async function advance(id: number) {
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/ce-cycles/${id}/advance/`, { note: "Advanced from CE console" });
      setMsg(`Cycle #${id} advanced.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Advance failed.");
    }
  }

  async function allocate(id: number) {
    setMsg(null);
    setErr(null);
    try {
      const res = await apiPost<{ allocated: number }>(`/ce-cycles/${id}/allocate/`, {});
      setMsg(`Groups allocated: ${res.data?.allocated ?? 0}`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Allocation failed.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">CE — Competitive Examination Management</h1>
      <p className={styles.help}>
        CSS lifecycle: paper prep → MPT → written → psych/medical/viva → group
        allocation (RFP Module 2).
      </p>
      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {err ? <div className="alert alert-error">{err}</div> : null}

      <div className="card stack">
        <h3>Open new CSS / CE cycle</h3>
        <form className={styles.formGrid} onSubmit={createCycle}>
          <div className="form-field">
            <label>Year</label>
            <input
              required
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="CSS Competitive Examination 2027"
            />
          </div>
          <div className="form-field" style={{ alignSelf: "end" }}>
            <Button type="submit">Create cycle</Button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>CE cycles</h3>
        <DataTable<CeCycle>
          rows={rows}
          getRowKey={(r) => r.id}
          columns={[
            { key: "year", header: "Year" },
            { key: "title", header: "Title" },
            {
              key: "phase",
              header: "Phase",
              render: (r) => (
                <StatusBadge status={r.phase_display || r.phase} />
              ),
            },
            {
              key: "actions",
              header: "Actions",
              render: (r) => (
                <span className={styles.actions}>
                  {r.phase !== "CLOSED" ? (
                    <Button variant="secondary" onClick={() => advance(r.id)}>
                      Advance phase
                    </Button>
                  ) : null}
                  <Button variant="ghost" onClick={() => allocate(r.id)}>
                    Allocate groups
                  </Button>
                </span>
              ),
            },
          ]}
        />
      </div>
    </StaffShell>
  );
}
