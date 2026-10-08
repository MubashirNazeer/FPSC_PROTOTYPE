"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { PhaseRail } from "@/components/PhaseRail";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import { GR_PHASES, grStatusToPhase } from "@/lib/grPhases";

import styles from "../mgmt.module.css";

type Requisition = {
  id: number;
  case_number?: string;
  post_title?: string;
  ministry?: string;
  bps?: number;
  vacancies?: number;
  status: string;
};

type Advertisement = {
  id: number;
  ref_number?: string;
  title?: string;
  is_published?: boolean;
  close_date?: string;
  kind?: string;
  fee_amount?: string | number;
};

type Application = {
  id: number;
  tracking_id?: string;
  candidate_name?: string;
  advertisement_title?: string;
  status: string;
  fee_paid?: boolean;
  roll_number?: string;
};

type Appeal = {
  id: number;
  application: number;
  tracking_id?: string;
  candidate_name?: string;
  reason?: string;
  status: string;
  decision_notes?: string;
};

type Hearing = {
  id: number;
  application: number;
  tracking_id?: string;
  scheduled_at?: string;
  venue?: string;
  outcome?: string;
};

type Attendance = {
  id: number;
  application: number;
  tracking_id?: string;
  exam_date?: string;
  present?: boolean;
  remarks?: string;
};

type Tab =
  | "requisitions"
  | "ads"
  | "applications"
  | "appeals"
  | "hearings"
  | "attendance";

const VALID_TABS: Tab[] = [
  "requisitions",
  "ads",
  "applications",
  "appeals",
  "hearings",
  "attendance",
];

export default function StaffGrPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading…</div>}>
      <StaffGrInner />
    </Suspense>
  );
}

function StaffGrInner() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "requisitions"
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) setTab(tabParam);
  }, [tabParam]);

  function goTab(next: Tab) {
    setTab(next);
    router.replace(`/staff/gr?tab=${next}`);
  }
  const [reqs, setReqs] = useState<Requisition[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [reqForm, setReqForm] = useState({
    case_number: "",
    ministry: "",
    department: "",
    post_title: "",
    bps: "17",
    vacancies: "1",
    domicile_required: "All Pakistan",
    received_at: new Date().toISOString().slice(0, 10),
  });
  const [adForm, setAdForm] = useState({
    ref_number: "",
    title: "",
    kind: "GR",
    fee_amount: "500",
    close_date: "",
    consolidated_html: "",
  });
  const [appealForm, setAppealForm] = useState({
    application: "",
    reason: "",
  });
  const [hearingForm, setHearingForm] = useState({
    application: "",
    scheduled_at: "",
    venue: "FPSC HQ, Islamabad",
  });
  const [attForm, setAttForm] = useState({
    application: "",
    exam_date: new Date().toISOString().slice(0, 10),
    present: true,
    remarks: "",
  });

  const load = async () => {
    const [r, a, ap, aps, h, at] = await Promise.all([
      apiGet<Requisition[]>("/requisitions/"),
      apiGet<Advertisement[]>("/advertisements/"),
      apiGet<Application[]>("/applications/"),
      apiGet<Appeal[]>("/appeals/"),
      apiGet<Hearing[]>("/hearings/"),
      apiGet<Attendance[]>("/attendance/"),
    ]);
    setReqs(Array.isArray(r.data) ? r.data : []);
    setAds(Array.isArray(a.data) ? a.data : []);
    setApps(Array.isArray(ap.data) ? ap.data : []);
    setAppeals(Array.isArray(aps.data) ? aps.data : []);
    setHearings(Array.isArray(h.data) ? h.data : []);
    setAttendance(Array.isArray(at.data) ? at.data : []);
  };

  useEffect(() => {
    if (!user) return;
    load().catch(() => {
      setReqs([]);
      setAds([]);
      setApps([]);
      setAppeals([]);
      setHearings([]);
      setAttendance([]);
    });
  }, [user]);

  async function createReq(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/requisitions/", {
        ...reqForm,
        bps: Number(reqForm.bps),
        vacancies: Number(reqForm.vacancies),
        status: "DRAFT",
      });
      setMsg("Requisition created.");
      setReqForm({
        ...reqForm,
        case_number: "",
        post_title: "",
        ministry: "",
      });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Create failed.");
    }
  }

  async function advance(id: number) {
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/requisitions/${id}/advance/`, {
        note: "Advanced from GR management console",
      });
      setMsg(`Requisition #${id} advanced.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Advance failed.");
    }
  }

  async function createAd(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/advertisements/", {
        ...adForm,
        fee_amount: Number(adForm.fee_amount),
        is_published: false,
        publish_date: new Date().toISOString().slice(0, 10),
      });
      setMsg("Advertisement created (unpublished).");
      setAdForm({
        ref_number: "",
        title: "",
        kind: "GR",
        fee_amount: "500",
        close_date: "",
        consolidated_html: "",
      });
      await load();
      setTab("ads");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Ad create failed.");
    }
  }

  async function publishAd(id: number) {
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/advertisements/${id}/publish/`, {});
      setMsg(`Advertisement #${id} published.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Publish failed.");
    }
  }

  async function issueAdmit(id: number) {
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/applications/${id}/issue_admit_card/`, {});
      setMsg(`Admit card issued for application #${id}.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Admit card failed.");
    }
  }

  async function scrutiny(id: number) {
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/applications/${id}/scrutiny/`, {});
      setMsg(`Scrutiny completed for application #${id}.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Scrutiny failed.");
    }
  }

  async function fileAppeal(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/appeals/", {
        application: Number(appealForm.application),
        reason: appealForm.reason,
      });
      setMsg("Appeal filed.");
      setAppealForm({ application: "", reason: "" });
      await load();
      setTab("appeals");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Appeal failed.");
    }
  }

  async function decideAppeal(id: number, status: string) {
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/appeals/${id}/decide/`, {
        status,
        decision_notes: `Decided as ${status} from GR console`,
      });
      setMsg(`Appeal #${id} → ${status}`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Decision failed.");
    }
  }

  async function scheduleHearing(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/hearings/", {
        application: Number(hearingForm.application),
        scheduled_at: hearingForm.scheduled_at,
        venue: hearingForm.venue,
      });
      setMsg("Personal hearing scheduled.");
      setHearingForm({
        application: "",
        scheduled_at: "",
        venue: "FPSC HQ, Islamabad",
      });
      await load();
      setTab("hearings");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Hearing failed.");
    }
  }

  async function markAttendance(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/attendance/", {
        application: Number(attForm.application),
        exam_date: attForm.exam_date,
        present: attForm.present,
        remarks: attForm.remarks,
      });
      setMsg("Attendance recorded.");
      setAttForm({
        application: "",
        exam_date: attForm.exam_date,
        present: true,
        remarks: "",
      });
      await load();
      setTab("attendance");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Attendance failed.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  const appOptions = apps.map((a) => (
    <option key={a.id} value={a.id}>
      {a.tracking_id || `#${a.id}`} — {a.candidate_name || "Candidate"}
    </option>
  ));

  return (
    <StaffShell userLabel={user?.username}>
      <PageHeader
        title="General Recruitment"
        lead="Every requisition from receipt to nomination, with its current phase and owning wing."
        refs={["GR-1.1 … GR-1.13"]}
      />
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>
          Lifecycle phases
        </h3>
        <PhaseRail phase={-1} labeled />
        <div className={styles.legend}>
          {GR_PHASES.map((g) => (
            <span key={g.key}>
              <i />
              {g.label} ({g.wing})
            </span>
          ))}
        </div>
      </div>
      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {err ? <div className="alert alert-error">{err}</div> : null}

      <div className={styles.tabs}>
        {(
          [
            ["requisitions", "1–2 Requisition / syllabus"],
            ["ads", "3 Advertisement"],
            ["applications", "4–7 Applications / scrutiny"],
            ["appeals", "Grievances"],
            ["hearings", "Hearings"],
            ["attendance", "5 Test attendance"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? styles.tabActive : styles.tab}
            onClick={() => goTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "requisitions" ? (
        <div className="stack">
          <div className="card stack">
            <h3>Register new requisition</h3>
            <form className={styles.formGrid} onSubmit={createReq}>
              <div className="form-field">
                <label>Case number</label>
                <input
                  required
                  value={reqForm.case_number}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, case_number: e.target.value })
                  }
                  placeholder="F.4-120/2026-R"
                />
              </div>
              <div className="form-field">
                <label>Post title</label>
                <input
                  required
                  value={reqForm.post_title}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, post_title: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Ministry</label>
                <input
                  required
                  value={reqForm.ministry}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, ministry: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Department</label>
                <input
                  value={reqForm.department}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, department: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>BPS</label>
                <input
                  type="number"
                  min={16}
                  value={reqForm.bps}
                  onChange={(e) => setReqForm({ ...reqForm, bps: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Vacancies</label>
                <input
                  type="number"
                  min={1}
                  value={reqForm.vacancies}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, vacancies: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Domicile</label>
                <input
                  value={reqForm.domicile_required}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, domicile_required: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Received date</label>
                <input
                  type="date"
                  required
                  value={reqForm.received_at}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, received_at: e.target.value })
                  }
                />
              </div>
              <div className="form-field" style={{ alignSelf: "end" }}>
                <Button type="submit">Create requisition</Button>
              </div>
            </form>
          </div>
          <div className="card">
            <h3>Requisition pipeline</h3>
            <DataTable<Requisition>
              rows={reqs}
              getRowKey={(r) => r.id}
              columns={[
                { key: "case_number", header: "Case No." },
                { key: "post_title", header: "Post" },
                { key: "ministry", header: "Ministry" },
                {
                  key: "bps",
                  header: "BPS",
                  render: (r) => String(r.bps ?? "—"),
                },
                {
                  key: "lifecycle",
                  header: "Lifecycle",
                  render: (r) => (
                    <PhaseRail phase={grStatusToPhase(r.status)} compact />
                  ),
                },
                {
                  key: "status",
                  header: "Phase",
                  render: (r) => {
                    const ph = grStatusToPhase(r.status);
                    return (
                      <span>
                        {GR_PHASES[ph]?.label || r.status}{" "}
                        <StatusBadge status={r.status} />
                      </span>
                    );
                  },
                },
                {
                  key: "actions",
                  header: "",
                  render: (r) =>
                    r.status !== "CLOSED" ? (
                      <Button variant="secondary" onClick={() => advance(r.id)}>
                        Forward phase
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

      {tab === "ads" ? (
        <div className="stack">
          <div className="card stack">
            <h3>Prepare advertisement</h3>
            <form className="stack" onSubmit={createAd}>
              <div className={styles.formGrid}>
                <div className="form-field">
                  <label>Ref number</label>
                  <input
                    required
                    value={adForm.ref_number}
                    onChange={(e) =>
                      setAdForm({ ...adForm, ref_number: e.target.value })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Kind</label>
                  <select
                    value={adForm.kind}
                    onChange={(e) => setAdForm({ ...adForm, kind: e.target.value })}
                  >
                    <option value="GR">GR</option>
                    <option value="CE">CE</option>
                    <option value="UEM">UEM</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Fee (Rs.)</label>
                  <input
                    type="number"
                    value={adForm.fee_amount}
                    onChange={(e) =>
                      setAdForm({ ...adForm, fee_amount: e.target.value })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Closing date</label>
                  <input
                    type="date"
                    required
                    value={adForm.close_date}
                    onChange={(e) =>
                      setAdForm({ ...adForm, close_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Title</label>
                <input
                  required
                  value={adForm.title}
                  onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Notice HTML / text</label>
                <textarea
                  rows={4}
                  value={adForm.consolidated_html}
                  onChange={(e) =>
                    setAdForm({ ...adForm, consolidated_html: e.target.value })
                  }
                  placeholder="<p>Applications are invited...</p>"
                />
              </div>
              <Button type="submit">Save advertisement</Button>
            </form>
          </div>
          <div className="card">
            <h3>Advertisement register</h3>
            <DataTable<Advertisement>
              rows={ads}
              getRowKey={(r) => r.id}
              columns={[
                { key: "ref_number", header: "Ref" },
                { key: "title", header: "Title" },
                { key: "kind", header: "Kind" },
                {
                  key: "is_published",
                  header: "Published",
                  render: (r) => (r.is_published ? "Yes" : "No"),
                },
                {
                  key: "close_date",
                  header: "Closes",
                  render: (r) => r.close_date || "—",
                },
                {
                  key: "actions",
                  header: "",
                  render: (r) =>
                    !r.is_published ? (
                      <Button variant="secondary" onClick={() => publishAd(r.id)}>
                        Publish
                      </Button>
                    ) : (
                      "Live"
                    ),
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {tab === "applications" ? (
        <div className="card">
          <h3>Candidate applications</h3>
          <DataTable<Application>
            rows={apps}
            getRowKey={(r) => r.id}
            columns={[
              { key: "tracking_id", header: "Tracking" },
              {
                key: "candidate_name",
                header: "Candidate",
                render: (r) => r.candidate_name || "—",
              },
              {
                key: "advertisement_title",
                header: "Advertisement",
                render: (r) => r.advertisement_title || "—",
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "fee_paid",
                header: "Fee",
                render: (r) => (r.fee_paid ? "Paid" : "Pending"),
              },
              {
                key: "actions",
                header: "Actions",
                render: (r) => (
                  <span className={styles.actions}>
                    {r.fee_paid && !r.roll_number ? (
                      <Button
                        variant="secondary"
                        onClick={() => issueAdmit(r.id)}
                      >
                        Issue admit card
                      </Button>
                    ) : null}
                    <Button variant="ghost" onClick={() => scrutiny(r.id)}>
                      Run scrutiny
                    </Button>
                  </span>
                ),
              },
            ]}
          />
        </div>
      ) : null}

      {tab === "appeals" ? (
        <div className="stack">
          <div className="card stack">
            <h3>File appeal / restoration</h3>
            <form className="stack" onSubmit={fileAppeal}>
              <div className={styles.formGrid}>
                <div className="form-field">
                  <label>Application</label>
                  <select
                    required
                    value={appealForm.application}
                    onChange={(e) =>
                      setAppealForm({ ...appealForm, application: e.target.value })
                    }
                  >
                    <option value="">Select…</option>
                    {appOptions}
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Reason</label>
                <textarea
                  required
                  rows={3}
                  value={appealForm.reason}
                  onChange={(e) =>
                    setAppealForm({ ...appealForm, reason: e.target.value })
                  }
                />
              </div>
              <Button type="submit">File appeal</Button>
            </form>
          </div>
          <div className="card">
            <h3>Appeals register</h3>
            <DataTable<Appeal>
              rows={appeals}
              getRowKey={(r) => r.id}
              columns={[
                {
                  key: "tracking_id",
                  header: "Tracking",
                  render: (r) => r.tracking_id || String(r.application),
                },
                {
                  key: "candidate_name",
                  header: "Candidate",
                  render: (r) => r.candidate_name || "—",
                },
                {
                  key: "reason",
                  header: "Reason",
                  render: (r) =>
                    (r.reason || "").slice(0, 60) +
                    ((r.reason || "").length > 60 ? "…" : ""),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <StatusBadge status={r.status} />,
                },
                {
                  key: "actions",
                  header: "Decide",
                  render: (r) =>
                    r.status === "FILED" || r.status === "UNDER_REVIEW" ? (
                      <span className={styles.actions}>
                        <Button
                          variant="secondary"
                          onClick={() => decideAppeal(r.id, "ACCEPTED")}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => decideAppeal(r.id, "RESTORED")}
                        >
                          Restore
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => decideAppeal(r.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </span>
                    ) : (
                      "—"
                    ),
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {tab === "hearings" ? (
        <div className="stack">
          <div className="card stack">
            <h3>Schedule personal hearing</h3>
            <form className={styles.formGrid} onSubmit={scheduleHearing}>
              <div className="form-field">
                <label>Application</label>
                <select
                  required
                  value={hearingForm.application}
                  onChange={(e) =>
                    setHearingForm({ ...hearingForm, application: e.target.value })
                  }
                >
                  <option value="">Select…</option>
                  {appOptions}
                </select>
              </div>
              <div className="form-field">
                <label>Date & time</label>
                <input
                  type="datetime-local"
                  required
                  value={hearingForm.scheduled_at}
                  onChange={(e) =>
                    setHearingForm({ ...hearingForm, scheduled_at: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Venue</label>
                <input
                  value={hearingForm.venue}
                  onChange={(e) =>
                    setHearingForm({ ...hearingForm, venue: e.target.value })
                  }
                />
              </div>
              <div className="form-field" style={{ alignSelf: "end" }}>
                <Button type="submit">Schedule</Button>
              </div>
            </form>
          </div>
          <div className="card">
            <h3>Hearings diary</h3>
            <DataTable<Hearing>
              rows={hearings}
              getRowKey={(r) => r.id}
              columns={[
                {
                  key: "tracking_id",
                  header: "Tracking",
                  render: (r) => r.tracking_id || String(r.application),
                },
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
                  key: "outcome",
                  header: "Outcome",
                  render: (r) => r.outcome || "Pending",
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {tab === "attendance" ? (
        <div className="stack">
          <div className="card stack">
            <h3>Mark exam attendance</h3>
            <form className={styles.formGrid} onSubmit={markAttendance}>
              <div className="form-field">
                <label>Application</label>
                <select
                  required
                  value={attForm.application}
                  onChange={(e) =>
                    setAttForm({ ...attForm, application: e.target.value })
                  }
                >
                  <option value="">Select…</option>
                  {appOptions}
                </select>
              </div>
              <div className="form-field">
                <label>Exam date</label>
                <input
                  type="date"
                  required
                  value={attForm.exam_date}
                  onChange={(e) =>
                    setAttForm({ ...attForm, exam_date: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Present</label>
                <select
                  value={attForm.present ? "yes" : "no"}
                  onChange={(e) =>
                    setAttForm({ ...attForm, present: e.target.value === "yes" })
                  }
                >
                  <option value="yes">Present</option>
                  <option value="no">Absent</option>
                </select>
              </div>
              <div className="form-field">
                <label>Remarks</label>
                <input
                  value={attForm.remarks}
                  onChange={(e) =>
                    setAttForm({ ...attForm, remarks: e.target.value })
                  }
                />
              </div>
              <div className="form-field" style={{ alignSelf: "end" }}>
                <Button type="submit">Save attendance</Button>
              </div>
            </form>
          </div>
          <div className="card">
            <h3>Attendance register</h3>
            <DataTable<Attendance>
              rows={attendance}
              getRowKey={(r) => r.id}
              columns={[
                {
                  key: "tracking_id",
                  header: "Tracking",
                  render: (r) => r.tracking_id || String(r.application),
                },
                { key: "exam_date", header: "Date" },
                {
                  key: "present",
                  header: "Status",
                  render: (r) => (r.present ? "Present" : "Absent"),
                },
                {
                  key: "remarks",
                  header: "Remarks",
                  render: (r) => r.remarks || "—",
                },
              ]}
            />
          </div>
        </div>
      ) : null}
    </StaffShell>
  );
}
