import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchPublic } from "@/lib/server-api";

import styles from "./ads.module.css";

type Advertisement = {
  id: number;
  title: string;
  ref_number?: string;
  close_date?: string;
  publish_date?: string;
  is_published?: boolean;
  kind?: string;
  fee_amount?: string | number;
  consolidated_html?: string;
};

export default async function AdsPage() {
  const ads =
    (await fetchPublic<Advertisement[]>("/advertisements/published/")) ?? [];

  return (
    <AppShell>
      <div className={`container stack ${styles.wrap}`}>
        <h1 className="page-title">Consolidated Advertisements</h1>
        <p className="page-lead">
          Official FPSC recruitment and examination notices. Create a candidate
          account to apply online, pay fee, and download admit cards.
        </p>
        {ads.length === 0 ? (
          <div className="card">
            <p className="muted">No published advertisements at this time.</p>
          </div>
        ) : (
          <div className="stack">
            {ads.map((ad) => (
              <article key={ad.id} className={`card ${styles.adCard}`}>
                <div className={styles.adTop}>
                  <div>
                    <p className={styles.ref}>{ad.ref_number || "FPSC Notice"}</p>
                    <h2>{ad.title}</h2>
                    <p className="muted">
                      Type: {ad.kind || "GR"}
                      {ad.publish_date
                        ? ` · Published ${new Date(ad.publish_date).toLocaleDateString()}`
                        : ""}
                      {ad.close_date
                        ? ` · Closes ${new Date(ad.close_date).toLocaleDateString()}`
                        : ""}
                      {ad.fee_amount != null ? ` · Fee Rs. ${ad.fee_amount}` : ""}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <StatusBadge status="PUBLISHED" />
                    <Button href={`/portal/apply/${ad.id}`} variant="primary">
                      Apply online
                    </Button>
                  </div>
                </div>
                {ad.consolidated_html ? (
                  <div
                    className={styles.body}
                    dangerouslySetInnerHTML={{ __html: ad.consolidated_html }}
                  />
                ) : null}
              </article>
            ))}
          </div>
        )}
        <p>
          Already registered? <Link href="/portal/login">Candidate login</Link>
        </p>
      </div>
    </AppShell>
  );
}
