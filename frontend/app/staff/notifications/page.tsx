"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

import styles from "../mgmt.module.css";

type Template = {
  id: number;
  code: string;
  channel: string;
  subject: string;
  body: string;
  is_active?: boolean;
};

type Outbox = {
  id: number;
  channel: string;
  template_code?: string;
  subject?: string;
  status: string;
  created_at?: string;
};

export default function StaffNotificationsPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [outbox, setOutbox] = useState<Outbox[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    channel: "EMAIL",
    subject: "",
    body: "Dear {name}, regarding {tracking_id} / {exam}.",
  });

  const load = async () => {
    const [t, o] = await Promise.all([
      apiGet<Template[]>("/notification-templates/"),
      apiGet<Outbox[]>("/notifications/"),
    ]);
    setTemplates(Array.isArray(t.data) ? t.data : []);
    setOutbox(Array.isArray(o.data) ? o.data : []);
  };

  useEffect(() => {
    if (!user) return;
    load().catch(() => {
      setTemplates([]);
      setOutbox([]);
    });
  }, [user]);

  async function createTemplate(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/notification-templates/", {
        ...form,
        is_active: true,
      });
      setMsg("Template saved.");
      setForm({
        code: "",
        channel: "EMAIL",
        subject: "",
        body: "Dear {name}, regarding {tracking_id} / {exam}.",
      });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Save failed.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">Notifications — Templates & Outbox</h1>
      <p className={styles.help}>
        Configurable email/SMS templates with placeholders {"{name}"},{" "}
        {"{tracking_id}"}, {"{exam}"} (RFP CC-02). Gateway delivery is mocked;
        messages land in the outbox.
      </p>
      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {err ? <div className="alert alert-error">{err}</div> : null}

      <div className="card stack">
        <h3>New template</h3>
        <form className="stack" onSubmit={createTemplate}>
          <div className={styles.formGrid}>
            <div className="form-field">
              <label>Code</label>
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="INTERVIEW_CALL"
              />
            </div>
            <div className="form-field">
              <label>Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                <option value="EMAIL">EMAIL</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
            <div className="form-field">
              <label>Subject</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
          </div>
          <div className="form-field">
            <label>Body</label>
            <textarea
              required
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
          <Button type="submit">Save template</Button>
        </form>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Templates</h3>
        <DataTable<Template>
          rows={templates}
          getRowKey={(r) => r.id}
          columns={[
            { key: "code", header: "Code" },
            { key: "channel", header: "Channel" },
            { key: "subject", header: "Subject" },
            {
              key: "is_active",
              header: "Active",
              render: (r) => (r.is_active ? "Yes" : "No"),
            },
          ]}
        />
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Outbox (recent)</h3>
        <DataTable<Outbox>
          rows={outbox.slice(0, 50)}
          getRowKey={(r) => r.id}
          columns={[
            { key: "channel", header: "Channel" },
            {
              key: "template_code",
              header: "Template",
              render: (r) => r.template_code || "—",
            },
            {
              key: "subject",
              header: "Subject",
              render: (r) => r.subject || "—",
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: "created_at",
              header: "Queued",
              render: (r) =>
                r.created_at ? new Date(r.created_at).toLocaleString() : "—",
            },
          ]}
        />
      </div>
    </StaffShell>
  );
}
