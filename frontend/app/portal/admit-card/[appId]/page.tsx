"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { useAuthGuard } from "@/lib/auth";
import { apiGet } from "@/lib/api";

type AdmitCard = {
  roll_number?: string;
  centre_name?: string;
  exam_date?: string;
  reporting_time?: string;
  instructions?: string;
};

export default function AdmitCardPage() {
  const params = useParams<{ appId: string }>();
  const { loading } = useAuthGuard({ redirectTo: "/portal/login" });
  const [card, setCard] = useState<AdmitCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    apiGet<AdmitCard>(`/applications/${params.appId}/admit_card/`)
      .then((res) => setCard(res.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Admit card unavailable.")
      );
  }, [loading, params.appId]);

  if (loading) {
    return (
      <AppShell>
        <div className="container">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 className="page-title">Admit card</h1>
        {error ? (
          <div className="alert alert-error">{error}</div>
        ) : card ? (
          <div className="card stack">
            <p>
              <strong>Roll number:</strong> {card.roll_number || "—"}
            </p>
            <p>
              <strong>Centre:</strong> {card.centre_name || "—"}
            </p>
            <p>
              <strong>Exam date:</strong>{" "}
              {card.exam_date
                ? new Date(card.exam_date).toLocaleString()
                : "—"}
            </p>
            <p>
              <strong>Reporting time:</strong> {card.reporting_time || "—"}
            </p>
            {card.instructions ? (
              <p className="muted">{card.instructions}</p>
            ) : null}
            <Button onClick={() => window.print()} variant="secondary">
              Print
            </Button>
          </div>
        ) : (
          <p className="muted">Loading admit card…</p>
        )}
        <Button href="/portal/applications" variant="ghost">
          ← Applications
        </Button>
      </div>
    </AppShell>
  );
}
