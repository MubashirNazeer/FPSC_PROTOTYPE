import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchPublic } from "@/lib/server-api";

type Advertisement = {
  id: number;
  title: string;
  reference_no?: string;
  closing_date?: string;
  status?: string;
  kind?: string;
};

export default async function AdsPage() {
  const ads = (await fetchPublic<Advertisement[]>("/advertisements/published/")) ?? [];

  return (
    <AppShell>
      <div className="container stack">
        <h1 className="page-title">Published Advertisements</h1>
        <p className="page-lead">
          Open competitive posts and examination announcements. Sign in to the
          candidate portal to apply online.
        </p>
        {ads.length === 0 ? (
          <div className="card">
            <p className="muted">No published advertisements at this time.</p>
          </div>
        ) : (
          <div className="stack">
            {ads.map((ad) => (
              <article key={ad.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ marginBottom: "0.25rem" }}>{ad.title}</h3>
                    <p className="muted">
                      Ref: {ad.reference_no || "—"}
                      {ad.closing_date
                        ? ` · Closes ${new Date(ad.closing_date).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {ad.status ? <StatusBadge status={ad.status} /> : null}
                    <Button href={`/portal/apply/${ad.id}`}>Apply</Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <p>
          <Link href="/portal/login">Candidate login</Link>
        </p>
      </div>
    </AppShell>
  );
}
