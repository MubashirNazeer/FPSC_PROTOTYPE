"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

import styles from "../mgmt.module.css";

type CeCycle = {
  id: number;
  year?: number;
  title?: string;
  phase?: string;
  phase_display?: string;
};

type Progress = {
  id: number;
  cycle: number;
  candidate: number;
  candidate_name?: string;
  mpt_passed?: boolean;
  psych_status?: string;
  medical_status?: string;
  viva_marks?: string | number | null;
  allocated_group?: string;
  allocated_service?: string;
  final_merit?: number | null;
};

type CeEvent = {
  id: number;
  cycle: number;
  event_type?: string;
  scheduled_at?: string;
  venue?: string;
  details?: string;
};

type Panel = {
  id: number;
  cycle: number;
  subject?: string;
  examiners?: string[];
  commission_approved?: boolean;
};

type Tab = "cycles" | "progress" | "events" | "panels";

export default function StaffCePage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [tab, setTab] = useState<Tab>("cycles");
  const [rows, setRows] = useState<CeCycle[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [events, setEvents] = useState<CeEvent[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    year: String(new Date().getFullYear()),
    title: "",
  });
  const [eventForm, setEventForm] = useState({
    cycle: "",
    event_type: "PSYCH",
    scheduled_at: "",
    venue: "FPSC HQ",
    details: "",
  });
  const [panelForm, setPanelForm] = useState({
    cycle: "",
    subject: "English Essay",
    examiners: "Examiner A, Examiner B",
  });

  const load = async () => {
    const [c, p, e, pan] = await Promise.all([
      apiGet<CeCycle[]>("/ce-cycles/"),
      apiGet<Progress[]>("/ce-progress/"),
      apiGet<CeEvent[]>("/ce-events/"),
      apiGet<Panel[]>("/ce-panels/"),
    ]);
    setRows(Array.isArray(c.data) ? c.data : []);
    setProgress(Array.isArray(p.data) ? p.data : []);
    setEvents(Array.isArray(e.data) ? e.data : []);
    setPanels(Array.isArray(pan.data) ? pan.data : []);
  };

  useEffect(() => {
    if (!user) return;
    load().catch(() => {
      setRows([]);
      setProgress([]);
      setEvents([]);
      setPanels([]);
    });
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

  async function updateProgress(
    id: number,
    patch: Partial<Progress>
  ) {
    setMsg(null);
    setErr(null);
    try {
      await apiPatch(`/ce-progress/${id}/`, patch);
      setMsg(`Candidate progress #${id} updated.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Update failed.");
    }
  }

  async function createEvent(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/ce-events/", {
        cycle: Number(eventForm.cycle),
        event_type: eventForm.event_type,
        scheduled_at: eventForm.scheduled_at,
        venue: eventForm.venue,
        details: eventForm.details,
      });
      setMsg("Schedule event created.");
      setEventForm({ ...eventForm, scheduled_at: "", details: "" });
      await load();
      setTab("events");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Event create failed.");
    }
  }

  async function createPanel(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/ce-panels/", {
        cycle: Number(panelForm.cycle),
        subject: panelForm.subject,
        examiners: panelForm.examiners
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setMsg("Examiner panel created.");
      setPanelForm({ ...panelForm, subject: "", examiners: "" });
      await load();
      setTab("panels");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Panel create failed.");
    }
  }

  async function approvePanel(id: number) {
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/ce-panels/${id}/approve/`, {});
      setMsg(`Panel #${id} commission-approved.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Approve failed.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  const cycleOptions = rows.map((c) => (
    <option key={c.id} value={c.id}>
      {c.year} — {c.title}
    </option>
  ));

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">CE — Competitive Examination Management</h1>
      <p className={styles.help}>
        CSS lifecycle: paper prep → MPT → written → psych/medical/viva → group
        allocation (RFP Module 2).
      </p>
      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {err ? <div className="alert alert-error">{err}</div> : null}

      <div className={styles.tabs}>
        {(
          [
            ["cycles", "Cycles"],
            ["progress", "Candidate progress"],
            ["events", "Schedule"],
            ["panels", "Examiner panels"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? styles.tabActive : styles.tab}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "cycles" ? (
        <div className="stack">
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

          <div className="card">
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
        </div>
      ) : null}

      {tab === "progress" ? (
        <div className="card">
          <h3>Psych / medical / viva / merit tracking</h3>
          <DataTable<Progress>
            rows={progress}
            getRowKey={(r) => r.id}
            columns={[
              {
                key: "candidate_name",
                header: "Candidate",
                render: (r) => r.candidate_name || `#${r.candidate}`,
              },
              { key: "cycle", header: "Cycle" },
              {
                key: "mpt_passed",
                header: "MPT",
                render: (r) => (r.mpt_passed ? "Pass" : "—"),
              },
              {
                key: "psych_status",
                header: "Psych",
                render: (r) => r.psych_status || "—",
              },
              {
                key: "medical_status",
                header: "Medical",
                render: (r) => r.medical_status || "—",
              },
              {
                key: "viva_marks",
                header: "Viva",
                render: (r) =>
                  r.viva_marks != null ? String(r.viva_marks) : "—",
              },
              {
                key: "allocated_group",
                header: "Group",
                render: (r) => r.allocated_group || "—",
              },
              {
                key: "actions",
                header: "Quick update",
                render: (r) => (
                  <span className={styles.actions}>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        updateProgress(r.id, { psych_status: "CLEARED" })
                      }
                    >
                      Clear psych
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        updateProgress(r.id, { medical_status: "FIT" })
                      }
                    >
                      Mark fit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => updateProgress(r.id, { viva_marks: 75 })}
                    >
                      Set viva 75
                    </Button>
                  </span>
                ),
              },
            ]}
          />
        </div>
      ) : null}

      {tab === "events" ? (
        <div className="stack">
          <div className="card stack">
            <h3>Schedule psych / medical / viva event</h3>
            <form className={styles.formGrid} onSubmit={createEvent}>
              <div className="form-field">
                <label>Cycle</label>
                <select
                  required
                  value={eventForm.cycle}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, cycle: e.target.value })
                  }
                >
                  <option value="">Select…</option>
                  {cycleOptions}
                </select>
              </div>
              <div className="form-field">
                <label>Type</label>
                <select
                  value={eventForm.event_type}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, event_type: e.target.value })
                  }
                >
                  <option value="MPT">MPT</option>
                  <option value="WRITTEN">Written</option>
                  <option value="PSYCH">Psychological</option>
                  <option value="MEDICAL">Medical</option>
                  <option value="VIVA">Viva Voce</option>
                </select>
              </div>
              <div className="form-field">
                <label>When</label>
                <input
                  type="datetime-local"
                  required
                  value={eventForm.scheduled_at}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, scheduled_at: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Venue</label>
                <input
                  value={eventForm.venue}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, venue: e.target.value })
                  }
                />
              </div>
              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <label>Details</label>
                <input
                  value={eventForm.details}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, details: e.target.value })
                  }
                />
              </div>
              <div className="form-field" style={{ alignSelf: "end" }}>
                <Button type="submit">Add event</Button>
              </div>
            </form>
          </div>
          <div className="card">
            <h3>CE schedule</h3>
            <DataTable<CeEvent>
              rows={events}
              getRowKey={(r) => r.id}
              columns={[
                { key: "cycle", header: "Cycle" },
                { key: "event_type", header: "Type" },
                {
                  key: "scheduled_at",
                  header: "When",
                  render: (r) =>
                    r.scheduled_at
                      ? new Date(r.scheduled_at).toLocaleString()
                      : "—",
                },
                { key: "venue", header: "Venue" },
                {
                  key: "details",
                  header: "Details",
                  render: (r) => r.details || "—",
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {tab === "panels" ? (
        <div className="stack">
          <div className="card stack">
            <h3>Create examiner panel</h3>
            <form className={styles.formGrid} onSubmit={createPanel}>
              <div className="form-field">
                <label>Cycle</label>
                <select
                  required
                  value={panelForm.cycle}
                  onChange={(e) =>
                    setPanelForm({ ...panelForm, cycle: e.target.value })
                  }
                >
                  <option value="">Select…</option>
                  {cycleOptions}
                </select>
              </div>
              <div className="form-field">
                <label>Subject</label>
                <input
                  required
                  value={panelForm.subject}
                  onChange={(e) =>
                    setPanelForm({ ...panelForm, subject: e.target.value })
                  }
                />
              </div>
              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <label>Examiners (comma-separated)</label>
                <input
                  required
                  value={panelForm.examiners}
                  onChange={(e) =>
                    setPanelForm({ ...panelForm, examiners: e.target.value })
                  }
                />
              </div>
              <div className="form-field" style={{ alignSelf: "end" }}>
                <Button type="submit">Create panel</Button>
              </div>
            </form>
          </div>
          <div className="card">
            <h3>Panels</h3>
            <DataTable<Panel>
              rows={panels}
              getRowKey={(r) => r.id}
              columns={[
                { key: "cycle", header: "Cycle" },
                { key: "subject", header: "Subject" },
                {
                  key: "examiners",
                  header: "Examiners",
                  render: (r) =>
                    Array.isArray(r.examiners)
                      ? r.examiners.join(", ")
                      : "—",
                },
                {
                  key: "commission_approved",
                  header: "Commission",
                  render: (r) => (r.commission_approved ? "Approved" : "Pending"),
                },
                {
                  key: "actions",
                  header: "",
                  render: (r) =>
                    !r.commission_approved ? (
                      <Button
                        variant="secondary"
                        onClick={() => approvePanel(r.id)}
                      >
                        Approve
                      </Button>
                    ) : (
                      "—"
                    ),
                },
              ]}
            />
          </div>
        </div>
      ) : null}
    </StaffShell>
  );
}
