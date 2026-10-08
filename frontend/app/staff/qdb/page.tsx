"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

import styles from "../mgmt.module.css";

type Taxonomy = { id: number; code: string; name: string };
type Question = {
  id: number;
  stem?: string;
  status: string;
  difficulty?: number;
  qtype?: string;
  taxonomy_name?: string;
  options?: Array<{ key: string; text: string }>;
  correct_answer?: { key?: string };
};
type Blueprint = {
  id: number;
  title: string;
  total_questions: number;
};
type Paper = {
  id: number;
  title?: string;
  status: string;
  authorizer_one?: number | null;
  authorizer_two?: number | null;
};

type Tab = "questions" | "taxonomy" | "blueprints" | "papers";

const emptyQuestion = {
  stem: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct: "A",
  difficulty: "3",
  taxonomy: "",
  qtype: "MCQ_SINGLE",
};

export default function StaffQdbPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading…</div>}>
      <StaffQdbInner />
    </Suspense>
  );
}

function StaffQdbInner() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(
    tabParam === "papers" ||
      tabParam === "taxonomy" ||
      tabParam === "blueprints"
      ? tabParam
      : "questions"
  );

  useEffect(() => {
    if (
      tabParam === "papers" ||
      tabParam === "taxonomy" ||
      tabParam === "blueprints" ||
      tabParam === "questions"
    ) {
      setTab(tabParam);
    }
  }, [tabParam]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [taxonomy, setTaxonomy] = useState<Taxonomy[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [qForm, setQForm] = useState(emptyQuestion);
  const [taxForm, setTaxForm] = useState({ code: "", name: "" });
  const [bpForm, setBpForm] = useState({ title: "", total_questions: "20" });
  const [genForm, setGenForm] = useState({ title: "", blueprint_id: "" });
  const [filter, setFilter] = useState("");

  const load = async () => {
    const [q, t, b, p] = await Promise.all([
      apiGet<Question[]>("/questions/"),
      apiGet<Taxonomy[]>("/taxonomy/"),
      apiGet<Blueprint[]>("/blueprints/"),
      apiGet<Paper[]>("/papers/"),
    ]);
    setQuestions(Array.isArray(q.data) ? q.data : []);
    setTaxonomy(Array.isArray(t.data) ? t.data : []);
    setBlueprints(Array.isArray(b.data) ? b.data : []);
    setPapers(Array.isArray(p.data) ? p.data : []);
  };

  useEffect(() => {
    if (!user) return;
    load().catch(() => {
      setQuestions([]);
      setTaxonomy([]);
      setBlueprints([]);
      setPapers([]);
    });
  }, [user]);

  const filteredQuestions = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(
      (item) =>
        (item.stem || "").toLowerCase().includes(q) ||
        String(item.id).includes(q) ||
        (item.status || "").toLowerCase().includes(q)
    );
  }, [questions, filter]);

  async function createQuestion(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/questions/", {
        stem: qForm.stem,
        qtype: qForm.qtype,
        difficulty: Number(qForm.difficulty),
        taxonomy: qForm.taxonomy ? Number(qForm.taxonomy) : null,
        options: [
          { key: "A", text: qForm.option_a },
          { key: "B", text: qForm.option_b },
          { key: "C", text: qForm.option_c },
          { key: "D", text: qForm.option_d },
        ],
        correct_answer: { key: qForm.correct },
        status: "DRAFT",
      });
      setQForm(emptyQuestion);
      setMsg("Question created as DRAFT.");
      await load();
      setTab("questions");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not create question.");
    }
  }

  async function advanceQuestion(id: number) {
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/questions/${id}/advance/`, {});
      setMsg(`Question #${id} status advanced.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Advance failed.");
    }
  }

  async function retireQuestion(id: number) {
    setMsg(null);
    setErr(null);
    try {
      await apiPatch(`/questions/${id}/`, { status: "RETIRED" });
      setMsg(`Question #${id} retired.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Retire failed.");
    }
  }

  async function createTaxonomy(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/taxonomy/", {
        code: taxForm.code.toUpperCase(),
        name: taxForm.name,
        level: 1,
      });
      setTaxForm({ code: "", name: "" });
      setMsg("Taxonomy node created.");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Taxonomy create failed.");
    }
  }

  async function createBlueprint(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/blueprints/", {
        title: bpForm.title,
        total_questions: Number(bpForm.total_questions),
        constraints: {
          difficulty_dist: { "1": 4, "2": 8, "3": 6, "4": 2 },
          reuse_limit: 100,
        },
      });
      setBpForm({ title: "", total_questions: "20" });
      setMsg("Blueprint created.");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Blueprint create failed.");
    }
  }

  async function generatePaper(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/papers/generate/", {
        title: genForm.title,
        blueprint_id: Number(genForm.blueprint_id),
      });
      setGenForm({ title: "", blueprint_id: "" });
      setMsg("Paper generated — pending dual authorization.");
      await load();
      setTab("papers");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Paper generation failed.");
    }
  }

  async function authorizePaper(id: number) {
    setMsg(null);
    setErr(null);
    try {
      await apiPost(`/papers/${id}/authorize/`, {});
      setMsg(`Authorization recorded for paper #${id}.`);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Authorization failed.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <PageHeader
        title="Question Data Bank"
        lead="Author, review, approve questions; build blueprints and dual-authorise papers for CBT."
        refs={["QDB-5.1 … QDB-5.12"]}
      />
      <p className={styles.help}>
        Full question lifecycle: Author → Review → Approve → Active → Paper
        generation with dual authorization (RFP Module 5A).
      </p>
      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {err ? <div className="alert alert-error">{err}</div> : null}

      <div className={styles.tabs}>
        {(
          [
            ["questions", "Questions"],
            ["taxonomy", "Taxonomy"],
            ["blueprints", "Blueprints"],
            ["papers", "Papers"],
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

      {tab === "questions" ? (
        <div className={`stack ${styles.panel}`}>
          <div className="card">
            <div className={styles.sectionHead}>
              <h3>Add new question</h3>
            </div>
            <form className="stack" onSubmit={createQuestion}>
              <div className="form-field">
                <label>Question stem</label>
                <textarea
                  required
                  rows={3}
                  value={qForm.stem}
                  onChange={(e) => setQForm({ ...qForm, stem: e.target.value })}
                />
              </div>
              <div className={styles.formGrid}>
                {(["a", "b", "c", "d"] as const).map((k) => (
                  <div className="form-field" key={k}>
                    <label>Option {k.toUpperCase()}</label>
                    <input
                      required
                      value={qForm[`option_${k}` as keyof typeof qForm]}
                      onChange={(e) =>
                        setQForm({ ...qForm, [`option_${k}`]: e.target.value })
                      }
                    />
                  </div>
                ))}
                <div className="form-field">
                  <label>Correct</label>
                  <select
                    value={qForm.correct}
                    onChange={(e) => setQForm({ ...qForm, correct: e.target.value })}
                  >
                    {["A", "B", "C", "D"].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Difficulty (1–5)</label>
                  <select
                    value={qForm.difficulty}
                    onChange={(e) =>
                      setQForm({ ...qForm, difficulty: e.target.value })
                    }
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={String(n)}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Taxonomy</label>
                  <select
                    value={qForm.taxonomy}
                    onChange={(e) =>
                      setQForm({ ...qForm, taxonomy: e.target.value })
                    }
                  >
                    <option value="">— Optional —</option>
                    {taxonomy.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} — {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Type</label>
                  <select
                    value={qForm.qtype}
                    onChange={(e) => setQForm({ ...qForm, qtype: e.target.value })}
                  >
                    <option value="MCQ_SINGLE">MCQ Single</option>
                    <option value="MCQ_MULTI">MCQ Multi</option>
                    <option value="TRUE_FALSE">True/False</option>
                    <option value="FILL_BLANK">Fill blank</option>
                  </select>
                </div>
              </div>
              <Button type="submit" variant="primary">
                Save question (DRAFT)
              </Button>
            </form>
          </div>

          <div className="card">
            <div className={styles.sectionHead}>
              <h3>Question bank ({filteredQuestions.length})</h3>
              <input
                placeholder="Search stem / id / status…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ minWidth: 220, padding: "0.45rem 0.65rem" }}
              />
            </div>
            <DataTable<Question>
              rows={filteredQuestions.slice(0, 100)}
              getRowKey={(r) => r.id}
              columns={[
                { key: "id", header: "ID" },
                {
                  key: "stem",
                  header: "Stem",
                  render: (r) => (
                    <div className={styles.stemCell}>
                      {(r.stem || "").length > 90
                        ? `${(r.stem || "").slice(0, 90)}…`
                        : r.stem || "—"}
                    </div>
                  ),
                },
                {
                  key: "taxonomy_name",
                  header: "Taxonomy",
                  render: (r) => r.taxonomy_name || "—",
                },
                {
                  key: "difficulty",
                  header: "Diff",
                  render: (r) => String(r.difficulty ?? "—"),
                },
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
                      {r.status !== "ACTIVE" && r.status !== "RETIRED" ? (
                        <Button
                          variant="secondary"
                          onClick={() => advanceQuestion(r.id)}
                        >
                          Advance
                        </Button>
                      ) : null}
                      {r.status !== "RETIRED" ? (
                        <Button variant="ghost" onClick={() => retireQuestion(r.id)}>
                          Retire
                        </Button>
                      ) : null}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {tab === "taxonomy" ? (
        <div className="card stack">
          <h3>Add taxonomy node</h3>
          <form className={styles.formGrid} onSubmit={createTaxonomy}>
            <div className="form-field">
              <label>Code</label>
              <input
                required
                value={taxForm.code}
                onChange={(e) => setTaxForm({ ...taxForm, code: e.target.value })}
                placeholder="e.g. GK-GEO"
              />
            </div>
            <div className="form-field">
              <label>Name</label>
              <input
                required
                value={taxForm.name}
                onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                placeholder="e.g. Geography"
              />
            </div>
            <div className="form-field" style={{ alignSelf: "end" }}>
              <Button type="submit">Add taxonomy</Button>
            </div>
          </form>
          <DataTable<Taxonomy>
            rows={taxonomy}
            getRowKey={(r) => r.id}
            columns={[
              { key: "code", header: "Code" },
              { key: "name", header: "Name" },
            ]}
          />
        </div>
      ) : null}

      {tab === "blueprints" ? (
        <div className="card stack">
          <h3>Create paper blueprint</h3>
          <form className={styles.formGrid} onSubmit={createBlueprint}>
            <div className="form-field">
              <label>Title</label>
              <input
                required
                value={bpForm.title}
                onChange={(e) => setBpForm({ ...bpForm, title: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Total questions</label>
              <input
                required
                type="number"
                min={5}
                max={100}
                value={bpForm.total_questions}
                onChange={(e) =>
                  setBpForm({ ...bpForm, total_questions: e.target.value })
                }
              />
            </div>
            <div className="form-field" style={{ alignSelf: "end" }}>
              <Button type="submit">Save blueprint</Button>
            </div>
          </form>
          <DataTable<Blueprint>
            rows={blueprints}
            getRowKey={(r) => r.id}
            columns={[
              { key: "id", header: "ID" },
              { key: "title", header: "Title" },
              { key: "total_questions", header: "Questions" },
            ]}
          />
        </div>
      ) : null}

      {tab === "papers" ? (
        <div className="stack">
          <div className="card stack">
            <h3>Generate exam paper</h3>
            <p className={styles.help}>
              Uses ACTIVE/APPROVED questions. Requires two different officers to
              authorize before CBT use.
            </p>
            <form className={styles.formGrid} onSubmit={generatePaper}>
              <div className="form-field">
                <label>Paper title</label>
                <input
                  required
                  value={genForm.title}
                  onChange={(e) =>
                    setGenForm({ ...genForm, title: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Blueprint</label>
                <select
                  required
                  value={genForm.blueprint_id}
                  onChange={(e) =>
                    setGenForm({ ...genForm, blueprint_id: e.target.value })
                  }
                >
                  <option value="">Select blueprint</option>
                  {blueprints.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id} — {b.title} ({b.total_questions}Q)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field" style={{ alignSelf: "end" }}>
                <Button type="submit">Generate paper</Button>
              </div>
            </form>
          </div>
          <div className="card">
            <h3>Papers — dual authorization</h3>
            <DataTable<Paper>
              rows={papers}
              getRowKey={(r) => r.id}
              columns={[
                { key: "id", header: "ID" },
                { key: "title", header: "Title" },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <StatusBadge status={r.status} />,
                },
                {
                  key: "auth",
                  header: "Auth",
                  render: (r) =>
                    `${r.authorizer_one ? "1" : "0"}/2${
                      r.authorizer_two ? " complete" : ""
                    }`,
                },
                {
                  key: "actions",
                  header: "",
                  render: (r) =>
                    r.status === "PENDING_DUAL" || r.status === "DRAFT" ? (
                      <Button
                        variant="secondary"
                        onClick={() => authorizePaper(r.id)}
                      >
                        Authorize
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
