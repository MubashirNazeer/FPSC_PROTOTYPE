import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { fetchPublic } from "@/lib/server-api";

import styles from "./home.module.css";

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  published_at?: string;
  category?: string;
};

type Advertisement = {
  id: number;
  ref_number: string;
  title: string;
  close_date?: string;
  fee_amount?: string;
};

export default async function HomePage() {
  const news = (await fetchPublic<NewsItem[]>("/news/")) ?? [];
  const ads =
    (await fetchPublic<Advertisement[]>("/advertisements/published/")) ?? [];

  return (
    <AppShell>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>Merit · Transparency · Excellence</p>
          <h1>Federal Public Service Commission</h1>
          <p className={styles.lead}>
            Official digital platform for consolidated advertisements, candidate
            applications, competitive examinations (CSS/MPT), computer-based
            testing, and FPSC staff workflows — aligned to RFP
            FPSC/PISC/SW/2026/01.
          </p>
          <div className={styles.ctaRow}>
            <Button href="/portal/login" variant="primary">
              Candidate Portal
            </Button>
            <Button href="/ads" variant="secondary">
              View Advertisements
            </Button>
            <Button href="/flows" variant="ghost">
              View Process Flows
            </Button>
          </div>
        </div>
      </section>

      <section className="container stack">
        <div className={styles.sectionHead}>
          <h2>Open Advertisements</h2>
          <Link href="/ads">All advertisements →</Link>
        </div>
        {ads.length === 0 ? (
          <div className="card muted">No published advertisements yet.</div>
        ) : (
          <div className="grid-2">
            {ads.slice(0, 4).map((ad) => (
              <article key={ad.id} className="card stack">
                <p className={styles.newsMeta}>{ad.ref_number}</p>
                <h3>{ad.title}</h3>
                <p className="muted">
                  Closing:{" "}
                  {ad.close_date
                    ? new Date(ad.close_date).toLocaleDateString()
                    : "See notice"}
                  {ad.fee_amount ? ` · Fee Rs. ${ad.fee_amount}` : ""}
                </p>
                <Button href={`/portal/apply/${ad.id}`} variant="secondary">
                  Apply online
                </Button>
              </article>
            ))}
          </div>
        )}

        <div className={styles.sectionHead}>
          <h2>Latest Notices</h2>
        </div>
        {news.length === 0 ? (
          <div className="card muted">No notices published.</div>
        ) : (
          <div className="grid-2">
            {news.slice(0, 4).map((item) => (
              <article key={item.id} className="card">
                <p className={styles.newsMeta}>
                  {item.category || "Announcement"}
                  {item.published_at
                    ? ` · ${new Date(item.published_at).toLocaleDateString()}`
                    : ""}
                </p>
                <h3>{item.title}</h3>
                <p className="muted">{item.summary || ""}</p>
              </article>
            ))}
          </div>
        )}

        <div className={styles.sectionHead}>
          <h2>RFP Process Flows (from tender diagrams)</h2>
          <Link href="/flows">Full guide →</Link>
        </div>
        <div className={styles.flowStrip}>
          <article className={`card ${styles.flowCard}`}>
            <img
              src="/rfp-flows/page12_img1.png"
              alt="General Recruitment end-to-end lifecycle from the FPSC RFP"
            />
            <h3>Module 1 — General Recruitment (GR)</h3>
            <p className="muted">
              Requisition → Advertisement → Applications → Exam → Result →
              Scrutiny → Nomination
            </p>
          </article>
          <article className={`card ${styles.flowCard}`}>
            <img
              src="/rfp-flows/page14_img1.png"
              alt="CSS Competitive Examination lifecycle from the FPSC RFP"
            />
            <h3>Module 2 — Competitive Examination (CSS)</h3>
            <p className="muted">
              Paper prep → MPT → Written → Psych → Medical → Viva → Group
              allocation
            </p>
          </article>
        </div>
      </section>
    </AppShell>
  );
}
