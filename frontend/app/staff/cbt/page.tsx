"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

import styles from "../mgmt.module.css";

type Sitting = {
  id: number;
  title?: string;
  status: string;
  mode?: string;
  paper_title?: string;
  centre?: number | null;
  duration_minutes?: number;
};

type Paper = { id: number; title?: string; status: string };
type Centre = { id: number; code?: string; name?: string; city?: string };
type CandidateOpt = { id: number; label: string };

export default function StaffCbtPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [rows, setRows] = useState<Sitting[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [candidates, setCandidates] = useState<CandidateOpt[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    paper: "",
    centre: "",
    mode: "CENTRALIZED",
    duration_minutes: "60",
    starts_at: "",
    ends_at: "",
  });
  const [enroll, setEnroll] = useState({ sitting_id: "", candidate_id: "" });

  const load = async () => {
    const [s, p, c, apps] = await Promise.all([
      apiGet<Sitting[]>("/cbt/sittings/"),
      apiGet<Paper[]>("/papers/"),
      apiGet<Centre[]>("/centres/"),
      apiGet<
        Array<{ candidate?: number; candidate_name?: string; tracking_id?: string }>
      >("/applications/"),
    ]);
    setRows(Array.isArray(s.data) ? s.data : []);
    setPapers(
      (Array.isArray(p.data) ? p.data : []).filter((x) => x.status === "APPROVED")
    );
    setCentres(Array.isArray(c.data) ? c.data : []);
    const map = new Map<number, string>();
    for (const a of Array.isArray(apps.data) ? apps.data : []) {
      if (a.candidate) {
        map.set(
          a.candidate,
          `${a.candidate_name || "Candidate"} (user #${a.candidate})`
        );
      }
    }
    setCandidates(
      Array.from(map.entries()).map(([id, label]) => ({ id, label }))
    );
  };

  useEffect(() => {
    if (!user) return;
    load().catch(() => {
      setRows([]);
      setPapers([]);
      setCentres([]);
    });
    // Pre-fill times
    const start = new Date();
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const isoLocal = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setForm((f) => ({
      ...f,
      starts_at: f.starts_at || isoLocal(start),
      ends_at: f.ends_at || isoLocal(end),
    }));
  }, [user]);

  async function createSitting(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/cbt/sittings/", {
        title: form.title,
        paper: Number(form.paper),
        centre: form.centre ? Number(form.centre) : null,
        mode: form.mode,
        duration_minutes: Number(form.duration_minutes),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        status: "SCHEDULED",
        shift: 1,
      });
      setMsg("CBT sitting created.");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Create sitting failed.");
    }
  }

  async function goLive(id: number) {
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/cbt/sittings/${id}/go_live/`, {});
      setMsg(`Sitting #${id} is LIVE.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Go live failed.");
    }
  }

  async function enrollCandidate(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/cbt/sittings/${enroll.sitting_id}/enroll/`, {
        candidate_id: Number(enroll.candidate_id),
      });
      setMsg("Candidate enrolled in sitting.");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Enroll failed.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">CBT — Examination Management</h1>
      <p className={styles.help}>
        Create sittings from approved papers, enroll candidates, go live, and
        monitor via invigilator board (RFP Module 5B).
      </p>
      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {err ? <div className="alert alert-error">{err}</div> : null}

      <div className="stack">
        <div className="card stack">
          <h3>Schedule new sitting</h3>
          <form className={styles.formGrid} onSubmit={createSitting}>
            <div className="form-field formGridFull">
              <label>Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Approved paper</label>
              <select
                required
                value={form.paper}
                onChange={(e) => setForm({ ...form, paper: e.target.value })}
              >
                <option value="">Select paper</option>
                {papers.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} — {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Centre</label>
              <select
                value={form.centre}
                onChange={(e) => setForm({ ...form, centre: e.target.value })}
              >
                <option value="">Optional</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Mode</label>
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
              >
                <option value="CENTRALIZED">Centralized</option>
                <option value="EDGE">Edge</option>
              </select>
            </div>
            <div className="form-field">
              <label>Duration (minutes)</label>
              <input
                type="number"
                min={10}
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Starts</label>
              <input
                type="datetime-local"
                required
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Ends</label>
              <input
                type="datetime-local"
                required
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </div>
            <div className="form-field" style={{ alignSelf: "end" }}>
              <Button type="submit">Create sitting</Button>
            </div>
          </form>
        </div>

        <div className="card stack">
          <h3>Enroll candidate</h3>
          <p className={styles.help}>
            Candidates are loaded from GR applications. Apply via portal first if
            the list is empty.
          </p>
          <form className={styles.formGrid} onSubmit={enrollCandidate}>
            <div className="form-field">
              <label>Sitting</label>
              <select
                required
                value={enroll.sitting_id}
                onChange={(e) =>
                  setEnroll({ ...enroll, sitting_id: e.target.value })
                }
              >
                <option value="">Select sitting</option>
                {rows.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} — {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Candidate</label>
              <select
                required
                value={enroll.candidate_id}
                onChange={(e) =>
                  setEnroll({ ...enroll, candidate_id: e.target.value })
                }
              >
                <option value="">Select candidate</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field" style={{ alignSelf: "end" }}>
              <Button type="submit">Enroll</Button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Sittings</h3>
          <DataTable<Sitting>
            rows={rows}
            getRowKey={(r) => r.id}
            columns={[
              { key: "id", header: "ID" },
              { key: "title", header: "Title" },
              {
                key: "paper_title",
                header: "Paper",
                render: (r) => r.paper_title || "—",
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
                  <span className={styles.actions}>
                    {r.status !== "LIVE" && r.status !== "CLOSED" ? (
                      <Button variant="secondary" onClick={() => goLive(r.id)}>
                        Go live
                      </Button>
                    ) : null}
                    <Link href={`/staff/cbt/invigilator/${r.id}`}>
                      Invigilator board
                    </Link>
                  </span>
                ),
              },
            ]}
          />
        </div>
      </div>
    </StaffShell>
  );
}
