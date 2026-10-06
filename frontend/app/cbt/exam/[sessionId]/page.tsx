"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

import styles from "./exam.module.css";

type OptionItem = { key: string; text: string };

type Question = {
  id: number;
  stem?: string;
  options?: OptionItem[] | Record<string, string>;
  answer?: unknown;
  flagged?: boolean;
};

type PaperPayload = {
  session?: {
    id: number;
    status: string;
    seconds_remaining?: number;
    flagged?: string[];
  };
  questions?: Question[];
};

function normalizeOptions(
  options?: OptionItem[] | Record<string, string>
): OptionItem[] {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  return Object.entries(options).map(([key, text]) => ({ key, text }));
}

export default function CbtExamPage() {
  const params = useParams<{ sessionId: string }>();
  const { user, loading: authLoading } = useAuthGuard({
    redirectTo: "/cbt/login",
  });
  const [payload, setPayload] = useState<PaperPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const questions = payload?.questions ?? [];
  const current = questions[index];

  const loadPaper = useCallback(async () => {
    const res = await apiGet<PaperPayload>(`/cbt/sessions/${params.sessionId}/paper/`);
    setPayload(res.data);
    if (res.data.session?.seconds_remaining != null) {
      setSeconds(res.data.session.seconds_remaining);
    }
    if (res.data.session?.status === "IN_PROGRESS") {
      setStarted(true);
    }
  }, [params.sessionId]);

  useEffect(() => {
    if (!user) return;
    loadPaper().catch(() => setMessage("Could not load examination paper."));
  }, [user, loadPaper]);

  useEffect(() => {
    if (!started || seconds == null || seconds <= 0) return;
    const t = window.setInterval(() => {
      setSeconds((s) => (s == null ? s : Math.max(0, s - 1)));
    }, 1000);
    return () => window.clearInterval(t);
  }, [started, seconds]);

  const timeLabel = useMemo(() => {
    if (seconds == null) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [seconds]);

  async function handleStart() {
    setMessage(null);
    try {
      const res = await apiPost<PaperPayload>(`/cbt/sessions/${params.sessionId}/start/`, {
        terminal_id: "WEB-01",
      });
      setPayload(res.data);
      setStarted(true);
      if (res.data.session?.seconds_remaining != null) {
        setSeconds(res.data.session.seconds_remaining);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not start exam.");
    }
  }

  async function saveAnswer(optionKey: string) {
    if (!current) return;
    try {
      const res = await apiPost<{ seconds_remaining?: number }>(
        `/cbt/sessions/${params.sessionId}/answer/`,
        { question_id: current.id, answer: { key: optionKey } }
      );
      if (res.data.seconds_remaining != null) setSeconds(res.data.seconds_remaining);
      setPayload((prev) => {
        if (!prev?.questions) return prev;
        const qs = prev.questions.map((q) =>
          q.id === current.id ? { ...q, answer: { key: optionKey } } : q
        );
        return { ...prev, questions: qs };
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save answer.");
    }
  }

  async function toggleFlag() {
    if (!current) return;
    try {
      await apiPost(`/cbt/sessions/${params.sessionId}/flag/`, {
        question_id: current.id,
      });
      await loadPaper();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not toggle flag.");
    }
  }

  async function submitExam() {
    if (!window.confirm("Submit examination? This cannot be undone.")) return;
    try {
      await apiPost(`/cbt/sessions/${params.sessionId}/submit/`, {});
      setMessage("Examination submitted successfully.");
      setStarted(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Submit failed.");
    }
  }

  if (authLoading) {
    return <div className="exam-shell" style={{ padding: "2rem" }}>Loading…</div>;
  }

  const flagged = new Set(
    (payload?.session?.flagged ?? []).map((id) => String(id))
  );
  const optionList = normalizeOptions(current?.options);

  return (
    <div className={`exam-shell ${styles.root}`}>
      <header className={styles.top}>
        <div>
          <strong>FPSC CBT</strong>
          <span className={styles.sub}>Session #{params.sessionId}</span>
        </div>
        <div className={styles.timer} aria-live="polite">
          Time remaining: {timeLabel}
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.navPanel}>
          <p className={styles.navTitle}>Question palette</p>
          <div className={styles.palette}>
            {questions.map((q, i) => (
              <button
                key={q.id}
                type="button"
                className={`${styles.paletteBtn} ${
                  i === index ? styles.paletteActive : ""
                } ${q.answer ? styles.answered : ""} ${
                  flagged.has(String(q.id)) || q.flagged ? styles.flagged : ""
                }`}
                onClick={() => setIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button variant="gold" onClick={submitExam} disabled={!started}>
            Submit exam
          </Button>
        </aside>

        <main className={styles.main}>
          {!started ? (
            <div className="card stack">
              <h1>Examination instructions</h1>
              <p>
                Ensure a stable connection. Do not refresh during the exam. Your
                responses autosave when you select an option.
              </p>
              {message ? <div className="alert alert-error">{message}</div> : null}
              <Button onClick={handleStart}>Start examination</Button>
            </div>
          ) : current ? (
            <div className="card stack">
              <p className={styles.qMeta}>
                Question {index + 1} of {questions.length}
              </p>
              <h2>{current.stem || "Question"}</h2>
              <div className={styles.options}>
                {optionList.map(({ key, text }) => {
                  const selected =
                    (current.answer as { key?: string } | undefined)?.key === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`${styles.option} ${selected ? styles.optionSelected : ""}`}
                      onClick={() => saveAnswer(key)}
                    >
                      <span className={styles.optionKey}>{key}</span>
                      {text}
                    </button>
                  );
                })}
              </div>
              <div className={styles.toolbar}>
                <Button variant="secondary" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                  Previous
                </Button>
                <Button variant="ghost" onClick={toggleFlag}>
                  {flagged.has(String(current.id)) || current.flagged
                    ? "Unflag"
                    : "Flag for review"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setIndex((i) => Math.min(questions.length - 1, i + 1))
                  }
                >
                  Next
                </Button>
              </div>
              {message ? <div className="alert alert-info">{message}</div> : null}
            </div>
          ) : (
            <div className="card">
              <p>No questions loaded.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
