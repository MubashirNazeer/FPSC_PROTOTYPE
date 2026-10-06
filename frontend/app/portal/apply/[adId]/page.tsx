"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { useAuthGuard } from "@/lib/auth";
import { apiPost } from "@/lib/api";

export default function ApplyPage() {
  const params = useParams<{ adId: string }>();
  const router = useRouter();
  const { loading } = useAuthGuard({ redirectTo: "/portal/login" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      await apiPost("/applications/apply/", {
        advertisement_id: Number(params.adId),
      });
      router.push("/portal/applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="container">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 className="page-title">Submit application</h1>
        <div className="card stack">
          <p>
            You are applying for advertisement <strong>#{params.adId}</strong>.
            Required documents can be uploaded in a production deployment; this MVP
            submits your application record to GR workflow.
          </p>
          {error ? <div className="alert alert-error">{error}</div> : null}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Confirm application"}
            </Button>
            <Button href="/ads" variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
