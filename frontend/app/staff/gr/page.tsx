"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

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

type Tab = "requisitions" | "ads" | "applications";

export default function StaffGrPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [tab, setTab] = useState<Tab>("requisitions");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reqs, setReqs] = useState<Requisition[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
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

  const load = async () => {
    const [r, a, ap] = await Promise.all([
      apiGet<Requisition[]>("/requisitions/"),
      apiGet<Advertisement[]>("/advertisements/"),
      apiGet<Application[]>("/applications/"),
    ]);
    setReqs(Array.isArray(r.data) ? r.data : []);
    setAds(Array.isArray(a.data) ? a.data : []);
    setApps(Array.isArray(ap.data) ? ap.data : []);
  };

  useEffect(() => {
    if (!user) return;
    load().catch(() => {
      setReqs([]);
      setAds([]);
      setApps([]);
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

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">GR — General Recruitment Management</h1>
      <p className={styles.help}>
        Requisition → advertisement → applications → admit cards / scrutiny
        (RFP Module 1).
      </p>
      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {err ? <div className="alert alert-error">{err}</div> : null}

      <div className={styles.tabs}>
        {(
          [
            ["requisitions", "Requisitions"],
            ["ads", "Advertisements"],
            ["applications", "Applications"],
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
                  key: "status",
                  header: "Status",
                  render: (r) => <StatusBadge status={r.status} />,
                },
                {
                  key: "actions",
                  header: "",
                  render: (r) =>
                    r.status !== "CLOSED" ? (
                      <Button variant="secondary" onClick={() => advance(r.id)}>
                        Advance phase
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
    </StaffShell>
  );
}
