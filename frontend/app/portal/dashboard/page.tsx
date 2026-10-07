"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { logout, useAuthGuard } from "@/lib/auth";
import { apiGet } from "@/lib/api";

type Application = {
  id: number;
  status: string;
  advertisement_title?: string;
  advertisement_close_date?: string | null;
};

export default function PortalDashboardPage() {
  const { user, loading } = useAuthGuard({ redirectTo: "/portal/login" });
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    if (!user) return;
    apiGet<Application[] | { results: Application[] }>("/applications/")
      .then((res) => {
        const data = res.data;
        setApps(Array.isArray(data) ? data : data.results ?? []);
      })
      .catch(() => setApps([]));
  }, [user]);

  if (loading) {
    return (
      <AppShell>
        <div className="container">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container stack">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 className="page-title">Welcome, {user?.first_name || user?.username}</h1>
            <p className="page-lead">Manage applications, fees, and examination documents.</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button href="/ads" variant="secondary">
              Browse ads
            </Button>
            <Button variant="ghost" onClick={() => logout("/portal/login")}>
              Sign out
            </Button>
          </div>
        </div>
        <div className="grid-2">
          <div className="card">
            <h3>Quick actions</h3>
            <ul>
              <li>
                <Link href="/portal/applications">My applications</Link>
              </li>
              <li>
                <Link href="/ads">Apply for an advertisement</Link>
              </li>
              <li>
                <Link href="/cbt/login">CBT examination login</Link>
              </li>
            </ul>
          </div>
          <div className="card">
            <h3>Recent applications</h3>
            {apps.length === 0 ? (
              <p className="muted">No applications yet.</p>
            ) : (
              <ul>
                {apps.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    {a.advertisement_title || `Application #${a.id}`} — {a.status}
                    {a.advertisement_close_date
                      ? ` (closes ${new Date(a.advertisement_close_date).toLocaleDateString()})`
                      : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
