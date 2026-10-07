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
};
type UemExam = {
  id: number;
  title?: string;
  current_stage?: string;
  exam_type?: number;
  exam_type_name?: string;
  advertisement?: number | null;
};
type UemReq = {
  id: number;
  ref_number?: string;
  post_title?: string;
  requesting_dept?: string;
  vacancies?: number;
  status?: string;
  exam_instance?: number | null;
};
type Report = {
  id: number;
  title?: string;
  report_type?: string;
  created_at?: string;
};
type Slot = {
  id: number;
  slot_type?: string;
  scheduled_at?: string;
  venue?: string;
};
type Marksheet = {
  id: number;
  candidate_name?: string;
  total?: string | number;
  recount_requested?: boolean;
};
type Ad = { id: number; ref_number?: string; title?: string };

type Tab =
  | "types"
  | "exams"
  | "requisitions"
  | "quota"
  | "reports"
  | "schedule"
  | "marksheets"
  | "intimations";

export default function StaffUemPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [tab, setTab] = useState<Tab>("exams");
  const [types, setTypes] = useState<ExamType[]>([]);
  const [exams, setExams] = useState<UemExam[]>([]);
  const [reqs, setReqs] = useState<UemReq[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sheets, setSheets] = useState<Marksheet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState("");

  const [typeForm, setTypeForm] = useState({
    code: "",
    name: "",
    stages: "REQUISITION,AD,APPLY,EXAM,SCRUTINY,RESULT",
  });
  const [examForm, setExamForm] = useState({
    title: "",
    exam_type: "",
    advertisement: "",
  });
  const [reqForm, setReqForm] = useState({
    ref_number: "",
    requesting_dept: "",
    post_title: "",
    vacancies: "1",
    exam_instance: "",
  });
  const [quotaForm, setQuotaForm] = useState({
    name: "",
    exam_instance: "",
    open_merit: "60",
    punjab: "20",
    sindh: "10",
    kpk: "5",
    balochistan: "5",
  });
  const [slotForm, setSlotForm] = useState({
    exam_instance: "",
    slot_type: "VIVA",
    scheduled_at: "",
    venue: "",
  });
  const [sheetForm, setSheetForm] = useState({
    exam_instance: "",
    application: "",
    total: "70",
  });
  const [intimation, setIntimation] = useState({
    subject: "",
    body: "",
    channel: "EMAIL",
  });

  const load = async () => {
    const [t, e, r, rep, s, m, a] = await Promise.all([
      apiGet<ExamType[]>("/exam-types/"),
      apiGet<UemExam[]>("/uem-exams/"),
      apiGet<UemReq[]>("/uem-requisitions/"),
      apiGet<Report[]>("/pre-exam-reports/"),
      apiGet<Slot[]>("/schedule-slots/"),
      apiGet<Marksheet[]>("/marksheets/"),
      apiGet<Ad[]>("/advertisements/"),
    ]);
    setTypes(Array.isArray(t.data) ? t.data : []);
    setExams(Array.isArray(e.data) ? e.data : []);
    setReqs(Array.isArray(r.data) ? r.data : []);
    setReports(Array.isArray(rep.data) ? rep.data : []);
    setSlots(Array.isArray(s.data) ? s.data : []);
    setSheets(Array.isArray(m.data) ? m.data : []);
    setAds(Array.isArray(a.data) ? a.data : []);
  };

  useEffect(() => {
    if (!user) return;
    load().catch(() => undefined);
  }, [user]);

  async function createType(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/exam-types/", {
        code: typeForm.code.toUpperCase(),
        name: typeForm.name,
        stages: typeForm.stages.split(",").map((x) => x.trim()).filter(Boolean),
        is_active: true,
      });
      setMsg("Exam type created (UEM-3.1).");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
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
        advertisement: examForm.advertisement
          ? Number(examForm.advertisement)
          : null,
      });
      setMsg("UEM exam instance created.");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  async function advance(id: number) {
    try {
      await apiPost(`/uem-exams/${id}/advance_stage/`, {});
      setMsg("Stage advanced.");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  async function createReq(e: FormEvent) {
    e.preventDefault();
    try {
      await apiPost("/uem-requisitions/", {
        ...reqForm,
        vacancies: Number(reqForm.vacancies),
        exam_instance: reqForm.exam_instance
          ? Number(reqForm.exam_instance)
          : null,
        status: "REGISTERED",
      });
      setMsg("UEM requisition registered (UEM-3.2).");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  async function createQuota(e: FormEvent) {
    e.preventDefault();
    try {
      await apiPost("/quota-rosters/", {
        name: quotaForm.name,
        exam_instance: Number(quotaForm.exam_instance),
        rules: {
          open_merit: Number(quotaForm.open_merit),
          punjab: Number(quotaForm.punjab),
          sindh: Number(quotaForm.sindh),
          kpk: Number(quotaForm.kpk),
          balochistan: Number(quotaForm.balochistan),
        },
      });
      setMsg("Quota roster saved (UEM-3.4).");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  async function genReports(id: number) {
    try {
      await apiPost(`/uem-exams/${id}/generate_pre_exam_reports/`, {});
      setMsg("Pre-exam reports generated (UEM-3.5).");
      await load();
      setTab("reports");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  async function createSlot(e: FormEvent) {
    e.preventDefault();
    try {
      await apiPost("/schedule-slots/", {
        exam_instance: Number(slotForm.exam_instance),
        slot_type: slotForm.slot_type,
        scheduled_at: new Date(slotForm.scheduled_at).toISOString(),
        venue: slotForm.venue,
      });
      setMsg("Schedule slot created (UEM-3.7).");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  async function createSheet(e: FormEvent) {
    e.preventDefault();
    try {
      await apiPost("/marksheets/", {
        exam_instance: Number(sheetForm.exam_instance),
        application: Number(sheetForm.application),
        marks: { written: Number(sheetForm.total) },
        total: Number(sheetForm.total),
        grade: Number(sheetForm.total) >= 60 ? "Pass" : "Fail",
      });
      setMsg("Marksheet issued (UEM-3.7).");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  async function buildMerit(id: number) {
    try {
      await apiPost(`/uem-exams/${id}/build_merit_list/`, { is_final: true });
      setMsg("Merit list built (UEM-3.7).");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  async function broadcast(id: number) {
    try {
      await apiPost(`/uem-exams/${id}/broadcast_intimation/`, intimation);
      setMsg("Intimations queued (UEM-3.8).");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  const tabs: [Tab, string][] = [
    ["types", "Exam types"],
    ["exams", "Exam instances"],
    ["requisitions", "Requisitions"],
    ["quota", "Quota roster"],
    ["reports", "Pre-exam reports"],
    ["schedule", "Psych/Medical/Viva"],
    ["marksheets", "Marksheets"],
    ["intimations", "Intimations"],
  ];

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">UEM — Full Unified Examination Management</h1>
      <p className={styles.help}>
        Covers UEM-3.1 to UEM-3.8: configurable exam types, requisitions, quota,
        pre-exam reports, scrutiny-linked apply (portal), scheduling, marksheets,
        merit, and intimations.
      </p>
      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {err ? <div className="alert alert-error">{err}</div> : null}

      <div className={styles.tabs}>
        {tabs.map(([key, label]) => (
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

      {tab === "types" ? (
        <div className="card stack">
          <h3>UEM-3.1 Exam type generator</h3>
          <form className={styles.formGrid} onSubmit={createType}>
            <div className="form-field">
              <label>Code</label>
              <input
                required
                value={typeForm.code}
                onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
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
              <label>Stages</label>
              <input
                required
                value={typeForm.stages}
                onChange={(e) => setTypeForm({ ...typeForm, stages: e.target.value })}
              />
            </div>
            <Button type="submit">Save type</Button>
          </form>
          <DataTable
            rows={types}
            getRowKey={(r) => r.id}
            columns={[
              { key: "code", header: "Code" },
              { key: "name", header: "Name" },
              {
                key: "stages",
                header: "Stages",
                render: (r) => (r.stages || []).join(" → "),
              },
            ]}
          />
        </div>
      ) : null}

      {tab === "exams" ? (
        <div className="stack">
          <div className="card stack">
            <h3>Create exam instance</h3>
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
                <label>Type</label>
                <select
                  required
                  value={examForm.exam_type}
                  onChange={(e) =>
                    setExamForm({ ...examForm, exam_type: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Advertisement (portal apply)</label>
                <select
                  value={examForm.advertisement}
                  onChange={(e) =>
                    setExamForm({ ...examForm, advertisement: e.target.value })
                  }
                >
                  <option value="">Optional</option>
                  {ads.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.ref_number}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">Create</Button>
            </form>
          </div>
          <div className="card">
            <DataTable
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
                  header: "Actions",
                  render: (r) => (
                    <span className={styles.actions}>
                      <Button variant="secondary" onClick={() => advance(r.id)}>
                        Advance
                      </Button>
                      <Button variant="ghost" onClick={() => genReports(r.id)}>
                        Pre-exam reports
                      </Button>
                      <Button variant="ghost" onClick={() => buildMerit(r.id)}>
                        Merit list
                      </Button>
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {tab === "requisitions" ? (
        <div className="card stack">
          <h3>UEM-3.2 Requisitions</h3>
          <form className={styles.formGrid} onSubmit={createReq}>
            <div className="form-field">
              <label>Ref</label>
              <input
                required
                value={reqForm.ref_number}
                onChange={(e) =>
                  setReqForm({ ...reqForm, ref_number: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Dept</label>
              <input
                required
                value={reqForm.requesting_dept}
                onChange={(e) =>
                  setReqForm({ ...reqForm, requesting_dept: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Post</label>
              <input
                required
                value={reqForm.post_title}
                onChange={(e) =>
                  setReqForm({ ...reqForm, post_title: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Vacancies</label>
              <input
                type="number"
                value={reqForm.vacancies}
                onChange={(e) =>
                  setReqForm({ ...reqForm, vacancies: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Exam instance</label>
              <select
                value={reqForm.exam_instance}
                onChange={(e) =>
                  setReqForm({ ...reqForm, exam_instance: e.target.value })
                }
              >
                <option value="">Optional</option>
                {exams.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Register</Button>
          </form>
          <DataTable
            rows={reqs}
            getRowKey={(r) => r.id}
            columns={[
              { key: "ref_number", header: "Ref" },
              { key: "post_title", header: "Post" },
              { key: "requesting_dept", header: "Dept" },
              { key: "vacancies", header: "Vacancies" },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
            ]}
          />
        </div>
      ) : null}

      {tab === "quota" ? (
        <div className="card stack">
          <h3>UEM-3.4 Quota roster</h3>
          <form className={styles.formGrid} onSubmit={createQuota}>
            <div className="form-field">
              <label>Name</label>
              <input
                required
                value={quotaForm.name}
                onChange={(e) => setQuotaForm({ ...quotaForm, name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Exam</label>
              <select
                required
                value={quotaForm.exam_instance}
                onChange={(e) =>
                  setQuotaForm({ ...quotaForm, exam_instance: e.target.value })
                }
              >
                <option value="">Select</option>
                {exams.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </div>
            {(["open_merit", "punjab", "sindh", "kpk", "balochistan"] as const).map(
              (k) => (
                <div className="form-field" key={k}>
                  <label>{k}</label>
                  <input
                    type="number"
                    value={quotaForm[k]}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, [k]: e.target.value })
                    }
                  />
                </div>
              )
            )}
            <Button type="submit">Save roster</Button>
          </form>
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="card">
          <h3>UEM-3.5 Pre-exam reports</h3>
          <p className={styles.help}>
            Generate from Exam instances tab → “Pre-exam reports”.
          </p>
          <DataTable
            rows={reports}
            getRowKey={(r) => r.id}
            columns={[
              { key: "title", header: "Title" },
              { key: "report_type", header: "Type" },
              { key: "created_at", header: "Created" },
            ]}
          />
        </div>
      ) : null}

      {tab === "schedule" ? (
        <div className="card stack">
          <h3>UEM-3.7 Psych / Medical / Viva / Hearing</h3>
          <form className={styles.formGrid} onSubmit={createSlot}>
            <div className="form-field">
              <label>Exam</label>
              <select
                required
                value={slotForm.exam_instance}
                onChange={(e) =>
                  setSlotForm({ ...slotForm, exam_instance: e.target.value })
                }
              >
                <option value="">Select</option>
                {exams.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Type</label>
              <select
                value={slotForm.slot_type}
                onChange={(e) =>
                  setSlotForm({ ...slotForm, slot_type: e.target.value })
                }
              >
                <option value="PSYCHOMETRIC">Psychometric</option>
                <option value="MEDICAL">Medical</option>
                <option value="VIVA">Viva</option>
                <option value="HEARING">Personal Hearing</option>
                <option value="SITUATIONAL">Situational</option>
              </select>
            </div>
            <div className="form-field">
              <label>When</label>
              <input
                type="datetime-local"
                required
                value={slotForm.scheduled_at}
                onChange={(e) =>
                  setSlotForm({ ...slotForm, scheduled_at: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Venue</label>
              <input
                value={slotForm.venue}
                onChange={(e) => setSlotForm({ ...slotForm, venue: e.target.value })}
              />
            </div>
            <Button type="submit">Schedule</Button>
          </form>
          <DataTable
            rows={slots}
            getRowKey={(r) => r.id}
            columns={[
              { key: "slot_type", header: "Type" },
              { key: "scheduled_at", header: "When" },
              { key: "venue", header: "Venue" },
            ]}
          />
        </div>
      ) : null}

      {tab === "marksheets" ? (
        <div className="card stack">
          <h3>UEM-3.7 Marksheets</h3>
          <form className={styles.formGrid} onSubmit={createSheet}>
            <div className="form-field">
              <label>Exam</label>
              <select
                required
                value={sheetForm.exam_instance}
                onChange={(e) =>
                  setSheetForm({ ...sheetForm, exam_instance: e.target.value })
                }
              >
                <option value="">Select</option>
                {exams.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Application ID</label>
              <input
                required
                type="number"
                value={sheetForm.application}
                onChange={(e) =>
                  setSheetForm({ ...sheetForm, application: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Total marks</label>
              <input
                type="number"
                value={sheetForm.total}
                onChange={(e) =>
                  setSheetForm({ ...sheetForm, total: e.target.value })
                }
              />
            </div>
            <Button type="submit">Issue marksheet</Button>
          </form>
          <DataTable
            rows={sheets}
            getRowKey={(r) => r.id}
            columns={[
              {
                key: "candidate_name",
                header: "Candidate",
                render: (r) => r.candidate_name || "—",
              },
              { key: "total", header: "Total" },
              {
                key: "recount_requested",
                header: "Recount",
                render: (r) => (r.recount_requested ? "Yes" : "No"),
              },
            ]}
          />
        </div>
      ) : null}

      {tab === "intimations" ? (
        <div className="card stack">
          <h3>UEM-3.8 Broadcast intimations</h3>
          <div className="form-field">
            <label>Exam instance</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              <option value="">Select</option>
              {exams.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Subject</label>
            <input
              value={intimation.subject}
              onChange={(e) =>
                setIntimation({ ...intimation, subject: e.target.value })
              }
            />
          </div>
          <div className="form-field">
            <label>Body</label>
            <textarea
              rows={4}
              value={intimation.body}
              onChange={(e) =>
                setIntimation({ ...intimation, body: e.target.value })
              }
            />
          </div>
          <div className="form-field">
            <label>Channel</label>
            <select
              value={intimation.channel}
              onChange={(e) =>
                setIntimation({ ...intimation, channel: e.target.value })
              }
            >
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push</option>
            </select>
          </div>
          <Button
            onClick={() => selectedExam && broadcast(Number(selectedExam))}
            disabled={!selectedExam}
          >
            Send to fee-paid candidates
          </Button>
        </div>
      ) : null}
    </StaffShell>
  );
}
