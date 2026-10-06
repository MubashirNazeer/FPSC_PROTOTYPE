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

export default async function HomePage() {
  const news = (await fetchPublic<NewsItem[]>("/news/")) ?? [];

  return (
    <AppShell>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>Merit · Transparency · Service</p>
          <h1>Federal Public Service Commission</h1>
          <p className={styles.lead}>
            Digital platform for competitive examinations, recruitment
            advertisements, candidate services, and integrated staff operations.
          </p>
          <div className={styles.ctaRow}>
            <Button href="/portal/login" variant="gold">
              Candidate Portal
            </Button>
            <Button href="/ads" variant="secondary">
              View Advertisements
            </Button>
            <Button href="/staff/login" variant="ghost">
              Staff EMS
            </Button>
          </div>
        </div>
      </section>

      <section className="container stack">
        <div className={styles.sectionHead}>
          <h2>Latest News & Announcements</h2>
          <Link href="/ads">All advertisements →</Link>
        </div>
        {news.length === 0 ? (
          <div className="card">
            <p className="muted">
              News feed will appear when the CMS API is available. Start the
              backend and run the demo seed for sample content.
            </p>
          </div>
        ) : (
          <div className="grid-2">
            {news.slice(0, 6).map((item) => (
              <article key={item.id} className="card">
                <p className={styles.newsMeta}>
                  {item.category || "Announcement"}
                  {item.published_at
                    ? ` · ${new Date(item.published_at).toLocaleDateString()}`
                    : ""}
                </p>
                <h3>{item.title}</h3>
                <p className="muted">{item.summary || "Read more on FPSC portal."}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
